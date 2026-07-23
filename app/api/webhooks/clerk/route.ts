import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Clerk Webhook receiver to sync registered user to Supabase
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { data, type } = payload;

    if (type === 'user.created') {
      const clerkId = data.id;
      const email = data.email_addresses?.[0]?.email_address || '';
      const username = data.username || data.first_name || `user_${Math.floor(Math.random() * 10000)}`;
      const usertag = username.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);
      const avatarUrl = data.image_url || '';

      // Check if user already exists
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('clerk_id', clerkId)
        .single();

      if (!existing) {
        await supabaseAdmin.from('users').insert({
          clerk_id: clerkId,
          email,
          username,
          usertag,
          avatar_url: avatarUrl,
          plan: 'free',
          is_frozen: false
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
