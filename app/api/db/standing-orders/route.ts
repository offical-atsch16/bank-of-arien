import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const { data: accounts } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('user_id', user.id);

    const accountIds = accounts?.map(a => a.id) || [];
    if (accountIds.length === 0) {
      return NextResponse.json({ standingOrders: [] });
    }

    const { data: standingOrders, error } = await supabaseAdmin
      .from('standing_orders')
      .select('*, sender_account:sender_account_id(name, iban), receiver_account:receiver_account_id(iban)')
      .in('sender_account_id', accountIds);

    if (error) throw error;

    return NextResponse.json({ standingOrders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { senderAccountId, receiverIban, amount, interval, nextExecution, endDate } = await req.json();

    const { data: receiverAcc } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('iban', receiverIban.trim())
      .single();

    if (!receiverAcc) {
      return NextResponse.json({ error: 'Empfänger-Konto anhand der IBAN nicht gefunden.' }, { status: 404 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('standing_orders')
      .insert({
        sender_account_id: senderAccountId,
        receiver_account_id: receiverAcc.id,
        amount: Number(amount),
        interval,
        next_execution: nextExecution,
        end_date: endDate || null,
        active: true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { id } = await req.json();

    const { error } = await supabaseAdmin
      .from('standing_orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
