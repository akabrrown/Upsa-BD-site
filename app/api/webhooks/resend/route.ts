import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { type, data } = body

        console.log('Resend Webhook received:', type, data?.email_id)

        // Handle email opened event
        if (type === 'email.opened') {
            const birthdayEmailId = data.tags?.birthday_email_id

            if (birthdayEmailId) {
                const { error } = await supabaseAdmin
                    .from('BirthdayEmail')
                    .update({
                        status: 'opened',
                        openedAt: new Date().toISOString()
                    })
                    .eq('id', birthdayEmailId)

                if (error) {
                    console.error(`Failed to mark email ${birthdayEmailId} as opened:`, error)
                } else {
                    console.log(`Email ${birthdayEmailId} marked as opened`)
                }
            }
        }

        // Handle reply
        if (type === 'email.replied') {
             const birthdayEmailId = data.tags?.birthday_email_id
             if (birthdayEmailId) {
                const { error } = await supabaseAdmin
                    .from('BirthdayEmail')
                    .update({
                        status: 'replied',
                        repliedAt: new Date().toISOString()
                    })
                    .eq('id', birthdayEmailId)

                if (error) {
                    console.error(`Failed to mark email ${birthdayEmailId} as replied:`, error)
                } else {
                    console.log(`Email ${birthdayEmailId} marked as replied`)
                }
             }
        }

        // We could also handle delivery and bounce events if needed

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}
