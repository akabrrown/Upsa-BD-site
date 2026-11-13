import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json()
        const { status } = body

        if (!['sent', 'opened', 'replied', 'failed'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const data: any = { status }
        if (status === 'replied') {
            data.repliedAt = new Date().toISOString()
        }

        const { data: updatedEmail, error } = await supabaseAdmin
            .from('BirthdayEmail')
            .update(data)
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            console.error('Failed to update email status via Supabase:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(updatedEmail)
    } catch (error: any) {
        console.error('Failed to update email status:', error)
        return NextResponse.json({ error: error?.message || 'Failed to update status' }, { status: 500 })
    }
}
