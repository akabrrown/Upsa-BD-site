import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
import { addPersonLimiter } from '@/lib/rateLimit'
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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'ALL'
    const sortBy = searchParams.get('sortBy') || 'NONE'

    const all = searchParams.get('all') === 'true'

    let query = supabaseAdmin
      .from('Person')
      .select('*, BirthdayEmail(status, sentAt)', { count: 'exact' })

    // Filtering
    if (role !== 'ALL') {
      query = query.eq('role', role)
    }

    if (search) {
      const s = `%${search}%`
      query = query.or(`surname.ilike.${s},otherNames.ilike.${s},email.ilike.${s},rank.ilike.${s}`)
    }

    // Sorting
    switch (sortBy) {
      case 'NAME_ASC':
        query = query.order('surname', { ascending: true }).order('otherNames', { ascending: true })
        break
      case 'NAME_DESC':
        query = query.order('surname', { ascending: false }).order('otherNames', { ascending: false })
        break
      case 'BIRTHDAY_ASC':
        query = query.order('birthMonth', { ascending: true }).order('birthDay', { ascending: true })
        break
      case 'BIRTHDAY_DESC':
        query = query.order('birthMonth', { ascending: false }).order('birthDay', { ascending: false })
        break
      default:
        query = query.order('createdAt', { ascending: false })
    }

    // Pagination
    let result
    if (all) {
      result = await query
    } else {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      result = await query.range(from, to)
    }
    
    const { data, count, error } = result

    if (error) {
      console.error('Failed to fetch people:', error)
      return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 })
    }

    return NextResponse.json({
      people: data || [],
      total: count || 0,
      page,
      pageSize
    })
  } catch (err: any) {
    console.error('GET /api/people error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    console.log(`IMPORT ATTEMPT: Received ${Array.isArray(body) ? body.length : 1} items from IP: ${ip}`)
    if (Array.isArray(body) && body.length > 0) {
      console.log('Sample data (Item 0):', JSON.stringify(body[0]))
    }

    if (Array.isArray(body)) {
      // Bulk insert
      if (body.length > 500000) {
        return NextResponse.json({ error: 'Bulk insert limited to 500,000 people' }, { status: 400 })
      }
      if (body.length === 0) {
        return NextResponse.json({ error: 'No valid people data found in the file' }, { status: 400 })
      }

      let validated: any[] = []
      try {
        validated = body.map((item: any, index: number) => {
          try {
            const val = personSchema.parse(item)
            val.surname = sanitizeInput(val.surname)
            val.otherNames = sanitizeInput(val.otherNames)
            val.email = sanitizeInput(val.email)
            if (val.rank) val.rank = sanitizeInput(val.rank)

            // Add updatedAt for direct Supabase inserts if not handled by DB triggers
            return { ...val, updatedAt: new Date().toISOString() }
          } catch (err: any) {
            if (err instanceof z.ZodError) {
              const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
              throw new Error(`Row ${index + 1} - ${issues}`)
            }
            throw err
          }
        })
      } catch (validationError: any) {
        console.error('Validation error during bulk import:', validationError)
        return NextResponse.json({
          error: `Import failed: ${validationError.message}`
        }, { status: 400 })
      }

      // 1. Deduplicate within the file itself (case-insensitive)
      const seenEmails = new Set<string>()
      const deduped = validated.filter(p => {
        const email = p.email.toLowerCase()
        if (seenEmails.has(email)) return false
        seenEmails.add(email)
        p.email = email // Force lowercase for stored data consistency
        return true
      })
      const internalDupes = validated.length - deduped.length

      // 2. Check for duplicates already in the database
      const emails = deduped.map(p => p.email)
      const existingEmails = new Set<string>()
      const DUPLICATE_CHUNK_SIZE = 1000

      for (let i = 0; i < emails.length; i += DUPLICATE_CHUNK_SIZE) {
        const emailChunk = emails.slice(i, i + DUPLICATE_CHUNK_SIZE)
        if (emailChunk.length > 0) {
          // Perform case-insensitive check if possible, or just gather all
          const { data: existing, error: checkError } = await supabaseAdmin
            .from('Person')
            .select('email')
            .in('email', emailChunk)

          if (checkError) {
            return NextResponse.json({ error: checkError.message }, { status: 500 })
          }

          existing?.forEach((e: { email: string }) => existingEmails.add(e.email.toLowerCase()))
        }
      }

      const peopleToInsert = deduped.filter(p => !existingEmails.has(p.email))
      const skippedCount = existingEmails.size + internalDupes

      try {
        await addPersonLimiter.consume(ip, 1)
      } catch {
        return NextResponse.json({ error: 'Too many requests. Please wait before importing again.' }, { status: 429 })
      }

      let totalInserted = 0
      const INSERT_CHUNK_SIZE = 500

      // Insert in chunks using upsert to handle any remaining edge-case duplicates
      for (let i = 0; i < peopleToInsert.length; i += INSERT_CHUNK_SIZE) {
        const chunk = peopleToInsert.slice(i, i + INSERT_CHUNK_SIZE)
        if (chunk.length > 0) {
          const { data: inserted, error: insertError } = await supabaseAdmin
            .from('Person')
            .upsert(chunk, { onConflict: 'email', ignoreDuplicates: true })
            .select('id')

          if (insertError) {
            return NextResponse.json({ error: `Failed during batch insertion. ${insertError.message}` }, { status: 500 })
          }
          totalInserted += inserted?.length || 0
        }
      }

      return NextResponse.json({
        count: totalInserted,
        skipped: skippedCount,
        total: validated.length
      })
    } else {
      // Single insert
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

      const { data: existing, error: checkError } = await supabaseAdmin
        .from('Person')
        .select('*')
        .eq('email', validated.email)
        .maybeSingle()

      if (checkError) {
        return NextResponse.json({ error: checkError.message }, { status: 500 })
      }
      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }

      try {
        await addPersonLimiter.consume(ip)
      } catch {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }

      const { data: person, error: insertError } = await supabaseAdmin
        .from('Person')
        .insert({ ...validated, updatedAt: new Date().toISOString() })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
      return NextResponse.json(person)
    }
  } catch (err: any) {
    console.error('CRITICAL UNHANDLED IMPORT ERROR:', err)
    return NextResponse.json({ error: `Server crash: ${err.message}` }, { status: 500 })
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.deleteAll) {
      // First delete all BirthdayEmail records
      const { error: emailDeleteError } = await supabaseAdmin
        .from('BirthdayEmail')
        .delete()
        .neq('personId', '00000000-0000-0000-0000-000000000000') // Deletes all

      if (emailDeleteError) {
        console.error('Failed to delete all birthday emails:', emailDeleteError)
        return NextResponse.json({ error: emailDeleteError.message }, { status: 500 })
      }

      // Then delete all Person records
      const { error } = await supabaseAdmin
        .from('Person')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Deletes all

      if (error) {
        console.error('Failed to delete all people:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, deletedCount: 'all' })
    }

    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided for deletion' }, { status: 400 })
    }

    const CHUNK_SIZE = 100
    let totalDeleted = 0

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE)

      // First delete BirthdayEmail records for these person IDs
      const { error: emailDeleteError } = await supabaseAdmin
        .from('BirthdayEmail')
        .delete()
        .in('personId', chunk)

      if (emailDeleteError) {
        console.error(`Failed to delete birthday emails for chunk at index ${i}:`, emailDeleteError)
        return NextResponse.json({ error: emailDeleteError.message }, { status: 500 })
      }

      // Then delete Person records
      const { error } = await supabaseAdmin
        .from('Person')
        .delete()
        .in('id', chunk)

      if (error) {
        console.error(`Failed to delete person chunk at index ${i}:`, error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      totalDeleted += chunk.length
    }

    return NextResponse.json({ success: true, deletedCount: totalDeleted })
  } catch (err: any) {
    console.error('CRITICAL UNHANDLED DELETE ERROR:', err)
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 })
  }
}
