import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateIBAN } from '@/lib/banking-utils';

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Resolve internal user id first
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const { data: accounts, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ accounts });
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

    const { name, type } = await req.json();

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    if (user.is_frozen) {
      return NextResponse.json({ error: 'Ihr Konto ist gesperrt.' }, { status: 403 });
    }

    // Create new account
    const iban = generateIBAN();
    const { data: account, error } = await supabaseAdmin
      .from('accounts')
      .insert({
        user_id: user.id,
        iban,
        name,
        type,
        balance: 0.00,
        currency: 'EUR'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
