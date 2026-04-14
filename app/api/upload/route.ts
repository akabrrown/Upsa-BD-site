import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, SVG' }, { status: 400 })
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 2MB.' }, { status: 400 })
        }

        const ext = file.name.split('.').pop() || 'png'
        const fileName = `template-images/${uuidv4()}.${ext}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        let { error: uploadError } = await supabaseAdmin.storage
            .from('uploads')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            })

        // If bucket doesn't exist, try to create it and retry upload
        if (uploadError?.message?.toLowerCase().includes('bucket not found')) {
            console.log('Bucket "uploads" not found, attempting to create...')
            const { error: createError } = await supabaseAdmin.storage.createBucket('uploads', {
                public: true,
                allowedMimeTypes: allowedTypes,
            })

            if (!createError) {
                console.log('Bucket "uploads" created successfully, retrying upload...')
                const { error: retryError } = await supabaseAdmin.storage
                    .from('uploads')
                    .upload(fileName, buffer, {
                        contentType: file.type,
                        upsert: false,
                    })
                uploadError = retryError
            } else {
                console.error('Failed to create bucket:', createError)
                uploadError = createError
            }
        }

        if (uploadError) {
            console.error('Final upload error:', uploadError)
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
        }

        const { data: urlData } = supabaseAdmin.storage
            .from('uploads')
            .getPublicUrl(fileName)

        return NextResponse.json({ url: urlData.publicUrl })
    } catch (err: any) {
        console.error('Upload error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
