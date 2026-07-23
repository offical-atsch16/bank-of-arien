import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyJWT } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token || !(await verifyJWT(token))) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'loans';

    if (type === 'loans') {
      const { data: loans } = await supabaseAdmin
        .from('loans')
        .select('*, user:user_id(username, email), account:account_id(iban)')
        .eq('status', 'pending');

      return NextResponse.json({ loans: loans || [] });
    }

    if (type === 'tickets') {
      const { data: tickets } = await supabaseAdmin
        .from('support_tickets')
        .select('*, user:user_id(username, email)')
        .order('created_at', { ascending: false });

      return NextResponse.json({ tickets: tickets || [] });
    }

    if (type === 'audit') {
      const { data: logs } = await supabaseAdmin
        .from('admin_audit_log')
        .select('*, admin:admin_id(username), user:target_user_id(username)')
        .order('created_at', { ascending: false });

      return NextResponse.json({ logs: logs || [] });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
