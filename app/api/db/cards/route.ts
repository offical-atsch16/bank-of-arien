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

    const { data: cards, error } = await supabaseAdmin
      .from('cards')
      .select('*, account:account_id(name, iban)')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ cards });
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

    const { action, cardId, isLocked, cardNumber, expiry, cvv, type, design, accountId } = await req.json();

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    if (action === 'toggle-lock') {
      const { error } = await supabaseAdmin
        .from('cards')
        .update({ is_locked: isLocked })
        .eq('id', cardId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Otherwise create
    const { data: card, error } = await supabaseAdmin
      .from('cards')
      .insert({
        user_id: user.id,
        account_id: accountId,
        card_number: cardNumber,
        expiry,
        cvv,
        type,
        is_locked: false,
        daily_limit: type === 'credit' ? 5000.00 : 10000.00,
        monthly_limit: type === 'credit' ? 15000.00 : 30000.00,
        design
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, card });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
