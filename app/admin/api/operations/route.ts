import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Admin API endpoint to approve/reject loans or answer support tickets
export async function POST(req: NextRequest) {
  try {
    const { action, loanId, ticketId, status, reply, adminId } = await req.json();

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    if (action === 'loan') {
      // Get loan details
      const { data: loan } = await supabaseAdmin
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();

      if (!loan) throw new Error('Kreditantrag nicht gefunden.');

      const { error: updateError } = await supabaseAdmin
        .from('loans')
        .update({ status })
        .eq('id', loanId);

      if (updateError) throw updateError;

      // Log action
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: adminId || null,
        action: `loan_${status}`,
        target_user_id: loan.user_id,
        details: { loanId, amount: loan.amount }
      });

      // Payout money directly to the account if approved!
      if (status === 'approved') {
        const payoutNote = `Auszahlung Kredit – BANK OF ARIEN`;
        await supabaseAdmin.rpc('admin_send_money', {
          p_receiver_account_id: loan.account_id,
          p_amount: Number(loan.amount),
          p_note: payoutNote,
          p_admin_id: adminId || null
        });

        // Notify
        await supabaseAdmin.from('notifications').insert({
          user_id: loan.user_id,
          type: 'loan',
          message: `Ihr Kredit über ${Number(loan.amount).toFixed(2)} EUR wurde bewilligt und ausgezahlt!`
        });
      } else {
        await supabaseAdmin.from('notifications').insert({
          user_id: loan.user_id,
          type: 'loan',
          message: `Ihr Kreditantrag wurde leider abgelehnt.`
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'support') {
      const { data: ticket } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (!ticket) throw new Error('Ticket nicht gefunden.');

      const { error: updateError } = await supabaseAdmin
        .from('support_tickets')
        .update({
          status: 'answered',
          admin_reply: reply
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      // Log action
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: adminId || null,
        action: 'answer_support_ticket',
        target_user_id: ticket.user_id,
        details: { ticketId }
      });

      // Notify
      await supabaseAdmin.from('notifications').insert({
        user_id: ticket.user_id,
        type: 'support',
        message: `Sie haben eine neue Antwort auf Ihre Support-Anfrage "${ticket.subject}" erhalten.`
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
