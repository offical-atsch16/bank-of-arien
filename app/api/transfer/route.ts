import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

// Server-side transfer execution logic with PIN verification
export async function POST(req: NextRequest) {
  try {
    const { senderAccountId, receiverIbanOrTag, amount, note, category, pin, clerkId } = await req.json();

    if (!senderAccountId || !receiverIbanOrTag || !amount || !pin || !clerkId) {
      return NextResponse.json({ error: 'Fehlende Pflichtangaben für Überweisung' }, { status: 400 });
    }

    // 1. Verify User PIN and check status
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    if (user.is_frozen) {
      return NextResponse.json({ error: 'Ihr Benutzerkonto ist gesperrt.' }, { status: 403 });
    }

    const pinMatch = await bcrypt.compare(pin, user.pin_hash);
    if (!pinMatch) {
      return NextResponse.json({ error: 'Ungültige Sicherheits-PIN.' }, { status: 401 });
    }

    // 2. Resolve Receiver Account by IBAN or Username or Usertag
    // Remove space or special chars if any from search term
    const cleanSearch = receiverIbanOrTag.trim();

    let receiverAccount = null;

    // First try resolving by IBAN
    const { data: accByIban } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('iban', cleanSearch)
      .single();

    if (accByIban) {
      receiverAccount = accByIban;
    } else {
      // Try resolving by Usertag (users.usertag) or username
      const { data: rxUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .or(`usertag.eq."${cleanSearch}",username.eq."${cleanSearch}"`)
        .single();

      if (rxUser) {
        // Find their checking (Hauptkonto) account
        const { data: rxAcc } = await supabaseAdmin
          .from('accounts')
          .select('id')
          .eq('user_id', rxUser.id)
          .eq('type', 'checking')
          .single();

        if (rxAcc) {
          receiverAccount = rxAcc;
        }
      }
    }

    if (!receiverAccount) {
      return NextResponse.json({ error: 'Empfänger konnte nicht anhand der IBAN, des Usertags oder des Usernamens gefunden werden.' }, { status: 404 });
    }

    if (senderAccountId === receiverAccount.id) {
      return NextResponse.json({ error: 'Überweisungen auf das identische Quellkonto sind nicht möglich.' }, { status: 400 });
    }

    // 3. Call transfer_money postgres RPC
    const { data, error: rpcError } = await supabaseAdmin.rpc('transfer_money', {
      p_sender_account_id: senderAccountId,
      p_receiver_account_id: receiverAccount.id,
      p_amount: Number(amount),
      p_note: note || 'Überweisung',
      p_category: category || 'general'
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (data && !data.success) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Überweisung erfolgreich ausgeführt!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
