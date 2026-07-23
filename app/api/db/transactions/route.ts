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
      return NextResponse.json({ transactions: [] });
    }

    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*, sender_account:sender_account_id(iban, name), receiver_account:receiver_account_id(iban, name)')
      .or(`sender_account_id.in.(${accountIds.join(',')}),receiver_account_id.in.(${accountIds.join(',')})`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ transactions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
