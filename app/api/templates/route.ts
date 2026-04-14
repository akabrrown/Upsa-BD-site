import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
import { z } from 'zod'

const templateSchema = z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    body: z.string().min(1),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    imageUrl: z.string().optional().nullable(),
    fontStyle: z.string().optional(),
    fontSize: z.string().optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        size: z.number().optional(),
    })).optional().default([]),
})

export async function GET() {
    const { data, error } = await supabaseAdmin
        .from('Template')
        .select('*')
        .order('createdAt', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validated = templateSchema.parse(body)

        // If creating as active, deactivate ALL other templates first
        if (validated.isActive === true) {
            await supabaseAdmin
                .from('Template')
                .update({ isActive: false })
        }

        const { data, error } = await supabaseAdmin
            .from('Template')
            .insert({ ...validated, updatedAt: new Date().toISOString() })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues.map(i => `${i.path}: ${i.message}`).join(', ') }, { status: 400 })
        }
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
