import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
            data.repliedAt = new Date()
        }

        const updatedEmail = await prisma.birthdayEmail.update({
            where: { id: params.id },
            data
        })

        return NextResponse.json(updatedEmail)
    } catch (error) {
        console.error('Failed to update email status:', error)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }
}
