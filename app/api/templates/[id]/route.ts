import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
import { z } from 'zod'

const updateSchema = z.object({
    name: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    imageUrl: z.string().optional().nullable(),
    fontStyle: z.string().optional(),
    fontSize: z.string().optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        size: z.number().optional(),
    })).optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json()
        const validated = updateSchema.parse(body)

        // If setting as active, deactivate ALL other templates first
        if (validated.isActive === true) {
            await supabaseAdmin
                .from('Template')
                .update({ isActive: false })
                .neq('id', params.id)
        }

        const { data, error } = await supabaseAdmin
            .from('Template')
            .update({ ...validated, updatedAt: new Date().toISOString() })
            .eq('id', params.id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
    const { error } = await supabaseAdmin
        .from('Template')
        .delete()
        .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
