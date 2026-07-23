import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Admin API endpoint to freeze/unfreeze users or update plan
export async function POST(req: NextRequest) {
  try {
    const { action, userId, targetPlan, isFrozen, adminId } = await req.json();

    if (!action || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (action === 'freeze') {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_frozen: isFrozen })
        .eq('id', userId);

      if (error) throw error;

      // Log in Audit Logs
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: adminId || null,
        action: isFrozen ? 'freeze_user' : 'unfreeze_user',
        target_user_id: userId,
        details: { isFrozen }
      });

      // Send System Notification to target user
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'system',
        message: isFrozen
          ? 'Ihr Konto wurde von der Bank vorübergehend gesperrt.'
          : 'Ihr Konto wurde erfolgreich entsperrt.'
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'plan') {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ plan: targetPlan })
        .eq('id', userId);

      if (error) throw error;

      // Log in Audit Logs
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: adminId || null,
        action: 'change_user_plan',
        target_user_id: userId,
        details: { newPlan: targetPlan }
      });

      // Notify
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'system',
        message: `Ihr Kontoplan wurde manuell auf den ${targetPlan.toUpperCase()}-Plan umgestellt.`
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
