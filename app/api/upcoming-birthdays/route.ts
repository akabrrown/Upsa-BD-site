import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dayParam = searchParams.get('day') || 'tomorrow'

    const today = new Date()
    const target = new Date(today)

    if (dayParam === 'yesterday') {
      target.setDate(target.getDate() - 1)
    } else if (dayParam === 'today') {
      // target stays as today
    } else {
      target.setDate(target.getDate() + 1)
    }

    const targetMonth = target.getMonth() + 1
    const targetDay = target.getDate()

    // First get the count quickly
    const { count, error: countError } = await supabaseAdmin
      .from('Person')
      .select('*', { count: 'exact', head: true })
      .eq('birthMonth', targetMonth)
      .eq('birthDay', targetDay)

    if (countError) throw countError

    // Then fetch only the columns we need
    const allBirthdays: any[] = []
    const PAGE_SIZE = 1000
    let from = 0

    while (true) {
      const { data, error } = await supabaseAdmin
        .from('Person')
        .select('id, surname, otherNames, role, rank, birthMonth, birthDay, email')
        .eq('birthMonth', targetMonth)
        .eq('birthDay', targetDay)
        .order('surname', { ascending: true })
        .range(from, from + PAGE_SIZE - 1)

      if (error) throw error

      allBirthdays.push(...(data || []))
      if (!data || data.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }

    // OPTIMIZED: Fetch latest email status for all people in one query
    const personIds = allBirthdays.map(p => p.id)
    const targetISO = target.toISOString().split('T')[0]
    
    const { data: allStatuses, error: statusError } = await supabaseAdmin
      .from('BirthdayEmail')
      .select('personId, status, sentAt')
      .in('personId', personIds)
      .gte('sentAt', `${targetISO}T00:00:00Z`)
      .lte('sentAt', `${targetISO}T23:59:59Z`)
      .order('sentAt', { ascending: false })

    if (statusError) console.error('Error fetching email statuses:', statusError)

    const statusMap = new Map<string, any>()
    allStatuses?.forEach((s: any) => {
      if (!statusMap.has(s.personId)) {
        statusMap.set(s.personId, s)
      }
    })

    const peopleWithStatus = allBirthdays.map(person => {
      const statusData = statusMap.get(person.id)
      return {
        ...person,
        emailStatus: statusData?.status || null,
        lastSentAt: statusData?.sentAt || null
      }
    })

    return NextResponse.json({ people: peopleWithStatus, totalCount: count || allBirthdays.length })
  } catch (error) {
    console.error('Failed to fetch upcoming birthdays:', error)
    return NextResponse.json({ error: 'Failed to fetch upcoming birthdays' }, { status: 500 })
  }
}
