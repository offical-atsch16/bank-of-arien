import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Admin API endpoint to disburse cash from BANK OF ARIEN (sender is null)
export async function POST(req: NextRequest) {
  try {
    const { receiverAccountId, amount, note, adminId } = await req.json();

    if (!receiverAccountId || !amount || !note) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Call Postgres RPC definition to safely trigger balance additions
    const { data, error } = await supabaseAdmin.rpc('admin_send_money', {
      p_receiver_account_id: receiverAccountId,
      p_amount: Number(amount),
      p_note: note,
      p_admin_id: adminId || null
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data && !data.success) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
