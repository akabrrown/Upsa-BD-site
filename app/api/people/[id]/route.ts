import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
import { sanitizeInput } from '@/lib/sanitize'
import { z } from 'zod'

const personSchema = z.object({
  surname: z.string().min(1),
  otherNames: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  email: z.string().email(),
  birthYear: z.number().int().optional().nullable(),
  birthMonth: z.number().min(1).max(12),
  birthDay: z.number().min(1).max(31),
  role: z.enum(['STAFF', 'STUDENT']),
  rank: z.string().optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: person, error } = await supabaseAdmin
      .from('Person')
      .select('*, BirthdayEmail(status, sentAt)')
      .eq('id', params.id)
      .maybeSingle()

    if (error) throw error
    if (!person) return NextResponse.json({ error: 'Person not found' }, { status: 404 })

    return NextResponse.json(person)
  } catch (error: any) {
    console.error('Failed to fetch person:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch person' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    let validated: any
    try {
      validated = personSchema.parse(body)
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
        return NextResponse.json({ error: `Validation failed: ${issues}` }, { status: 400 })
      }
      throw err
    }

    validated.surname = sanitizeInput(validated.surname)
    validated.otherNames = sanitizeInput(validated.otherNames)
    validated.email = sanitizeInput(validated.email)
    if (validated.rank) validated.rank = sanitizeInput(validated.rank)

    const { data: person, error } = await supabaseAdmin
      .from('Person')
      .update({ ...validated, updatedAt: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(person)
  } catch (error: any) {
    console.error('Failed to update person:', error)
    return NextResponse.json({ error: error.message || 'Failed to update person' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Delete associated BirthdayEmail records first to avoid foreign key violation
    const { error: emailDeleteError } = await supabaseAdmin
      .from('BirthdayEmail')
      .delete()
      .eq('personId', params.id)

    if (emailDeleteError) throw emailDeleteError

    // 2. Delete the Person record
    const { error } = await supabaseAdmin
      .from('Person')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete person:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete person' }, { status: 500 })
  }
}
