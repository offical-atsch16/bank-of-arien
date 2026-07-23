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

    const { data: loans, error } = await supabaseAdmin
      .from('loans')
      .select('*, account:account_id(name, iban)')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ loans });
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

    const { amount, termMonths, interestRate, monthlyPayment, accountId } = await req.json();

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const { data: loan, error } = await supabaseAdmin
      .from('loans')
      .insert({
        user_id: user.id,
        account_id: accountId,
        amount: Number(amount),
        interest_rate: Number(interestRate),
        term_months: Number(termMonths),
        monthly_payment: Number(monthlyPayment),
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, loan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
