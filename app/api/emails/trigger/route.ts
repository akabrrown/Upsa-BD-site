import { NextResponse } from 'next/server'
import { processBirthdayEmails } from '@/lib/birthday-service'

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const force = searchParams.get('force') === 'true'
        const result = await processBirthdayEmails(force)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Manual trigger failed:', error)
        return NextResponse.json({ error: error.message || 'Failed to trigger emails' }, { status: 500 })
    }
}
