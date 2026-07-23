import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { signJWT as signLocalJWT } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username und Passwort erforderlich' }, { status: 400 });
    }

    // Lookup admin in admin_users table
    const { data: admin, error: dbError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (dbError || !admin) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }

    // Create session token
    const token = await signLocalJWT({
      adminId: admin.id,
      username: admin.username
    });

    const response = NextResponse.json({ success: true, redirect: '/admin/dashboard' });

    // Set cookie
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2 // 2 hours
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
