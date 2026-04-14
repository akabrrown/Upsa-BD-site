import { NextRequest, NextResponse } from 'next/server'
import { processBirthdayEmails } from '@/lib/birthday-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processBirthdayEmails()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ error: error.message || 'Cron job failed' }, { status: 500 })
  }
}
