import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyJWT } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token || !(await verifyJWT(token))) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Fetch users count
    const { data: usersData } = await supabaseAdmin.from('users').select('*');
    // Fetch accounts total balance
    const { data: accountsData } = await supabaseAdmin.from('accounts').select('balance');
    // Fetch transactions count
    const { data: txsData } = await supabaseAdmin.from('transactions').select('id');

    const totalB = accountsData?.reduce((acc, curr) => acc + Number(curr.balance), 0) || 0;

    return NextResponse.json({
      usersCount: usersData?.length || 0,
      totalBalance: totalB,
      transactionsCount: txsData?.length || 0,
      users: usersData || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
