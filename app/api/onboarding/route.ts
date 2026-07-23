import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateIBAN, generateCardNumber, generateCVV, generateExpiryDate } from '@/lib/banking-utils';
import bcrypt from 'bcryptjs';

// Server-side onboarding completion API.
// Creates Supabase user (if clerk hook didn't fire yet), default accounts, and starting balance.
export async function POST(req: NextRequest) {
  try {
    const { clerkId, email, username, fullName, birthday, address, pin, plan = 'free' } = await req.json();

    if (!clerkId || !email || !pin) {
      return NextResponse.json({ error: 'Missing required onboarding parameters' }, { status: 400 });
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const usertag = username.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);

    // 1. Get or create user
    let user;
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (existingUser) {
      user = existingUser;
      // Update details including pin
      const { data: updated } = await supabaseAdmin
        .from('users')
        .update({ pin_hash: pinHash, plan })
        .eq('id', user.id)
        .select()
        .single();
      user = updated;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          clerk_id: clerkId,
          email,
          username,
          usertag,
          plan,
          pin_hash: pinHash,
          is_frozen: false
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // 2. Check if checking account already exists
    const { data: existingAccount } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'checking')
      .single();

    if (!existingAccount) {
      // 3. Create Girokonto (Checking Account)
      const startBalance = 1000.00; // Free starting bonus!
      const checkingIban = generateIBAN();

      const { data: account, error: accError } = await supabaseAdmin
        .from('accounts')
        .insert({
          user_id: user.id,
          iban: checkingIban,
          name: 'Girokonto Hauptkonto',
          type: 'checking',
          balance: startBalance,
          currency: 'EUR'
        })
        .select()
        .single();

      if (accError) throw accError;

      // 4. Create standard virtual debit card
      await supabaseAdmin
        .from('cards')
        .insert({
          user_id: user.id,
          account_id: account.id,
          card_number: generateCardNumber(),
          expiry: generateExpiryDate(),
          cvv: generateCVV(),
          type: 'debit',
          is_locked: false,
          daily_limit: 1000.00,
          monthly_limit: 5000.00,
          design: 'standard'
        });

      // 5. Add a welcome transaction
      await supabaseAdmin
        .from('transactions')
        .insert({
          sender_account_id: null, // From BANK OF ARIEN
          receiver_account_id: account.id,
          amount: startBalance,
          note: 'Willkommensbonus zur Kontoeröffnung – BANK OF ARIEN',
          category: 'system',
          type: 'bank_credit',
          status: 'completed'
        });

      // 6. Create support ticket for Welcome message
      await supabaseAdmin
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: 'Willkommen bei BANK OF ARIEN!',
          message: `Hallo ${fullName || username},\nvielen Dank für die Eröffnung Ihres Kontos bei der BANK OF ARIEN.\nWir haben Ihnen ein Startguthaben von ${startBalance} EUR auf Ihr Girokonto gutgeschrieben.\nBei Fragen wenden Sie sich jederzeit an unseren Support.\n\nHerzliche Grüße,\nIhr Team der BANK OF ARIEN`,
          status: 'answered',
          admin_reply: 'Gerne geschehen! Bei weiteren Fragen sind wir da.'
        });

      // 7. Add notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'system',
          message: `Konto erfolgreich eröffnet! 1.000,00 EUR Startguthaben wurden gutgeschrieben.`
        });
    }

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
