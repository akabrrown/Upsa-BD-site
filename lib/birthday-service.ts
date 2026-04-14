import { supabaseAdmin } from './supabase-admin'
import { resend } from './email'

export async function processBirthdayEmails(force: boolean = false) {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()
    const todayISO = today.toISOString().split('T')[0]

    console.log(`Starting birthday email processing for ${todayISO}...`)

    // 1. Fetch active template
    const { data: template } = await supabaseAdmin
        .from('Template')
        .select('*')
        .eq('isActive', true)
        .order('updatedAt', { ascending: false })
        .limit(1)
        .single()

    console.log('Active Template Data:', {
        id: template?.id,
        name: template?.name,
        fontStyle: (template as any)?.fontStyle,
        fontSize: (template as any)?.fontSize
    })

    // 2. Fetch people with birthday today
    const { data: people, error } = await supabaseAdmin
        .from('Person')
        .select('*')
        .eq('birthMonth', month)
        .eq('birthDay', day)

    if (error) throw error
    if (!people || people.length === 0) {
        return { success: true, count: 0, message: 'No birthdays today' }
    }

    let sentCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (const person of people) {
        // 3. Check for duplicates (already sent today)
        const { data: alreadySent } = await supabaseAdmin
            .from('BirthdayEmail')
            .select('id')
            .eq('personId', person.id)
            .eq('status', 'sent')
            .gte('sentAt', `${todayISO}T00:00:00Z`)
            .lte('sentAt', `${todayISO}T23:59:59Z`)
            .limit(1)

        if (!force && alreadySent && alreadySent.length > 0) {
            console.log(`Skipping ${person.email} - email already sent today`)
            skippedCount++
            continue
        }

        const personName = `${person.otherNames} ${person.surname}`.toUpperCase()
        let subject = template?.subject || 'Happy Birthday from UPSA! 🎂'
        let htmlBody = template?.body || `<p>Dear ${personName},</p><p>Happy Birthday from the University of Professional Studies, Accra! We hope you have a wonderful day.</p>`

        // Replace placeholders
        const replaceAll = (text: string) => text
            .replace(/\[Name\]/g, personName)
            .replace(/\[Surname\]/g, person.surname.toUpperCase())
            .replace(/\[OtherNames\]/g, person.otherNames.toUpperCase())
            .replace(/\[Role\]/g, person.role || '')
            .replace(/\[Rank\]/g, person.rank || '')

        subject = replaceAll(subject)
        const rawContentHtml = replaceAll(htmlBody)

        const fontStack = `${template?.fontStyle ? `'${template.fontStyle}', ` : ''}Arial, Helvetica, sans-serif`;
        const fontSize = template?.fontSize || '16px';
        const baseStyle = `font-family: ${fontStack}; font-size: ${fontSize};`;

        // Create a temporary record to get the ID for tracking
        const { data: emailRecord } = await supabaseAdmin
            .from('BirthdayEmail')
            .insert({
                personId: person.id,
                status: 'sending',
                subject: subject,
                sentAt: new Date().toISOString()
            })
            .select()
            .single();

        const emailId = emailRecord?.id || '';

        // Transform Tiptap content with flexible regex for tags with/without attributes
        let contentHtml = rawContentHtml;
        
        // Robust image alignment handling before injecting base styles
        contentHtml = contentHtml.replace(
            /<img([^>]*?)style="([^"]*?)text-align:\s*(center|right|left)([^"]*?)"([^>]*?)>/gi,
            (match, p1, p2, align, p4, p5) => {
                let margin = 'margin: 24px 0;'
                if (align === 'center') margin = 'margin: 24px auto;'
                if (align === 'right') margin = 'margin: 24px 0 24px auto;'
                if (align === 'left') margin = 'margin: 24px auto 24px 0;'
                return `<img${p1}style="${p2}display: block; ${margin}${p4}"${p5}>`
            }
        );

        // 1. Inject extra styles into specific block tags without forcing base font on every node
        const injectStyle = (tag: string, extraStyles: string = '') => {
            if (!extraStyles) return;
            const regex = new RegExp(`<${tag}([^a-zA-Z0-9][^>]*)?>`, 'gi');
            contentHtml = contentHtml.replace(regex, (match, attrs = '') => {
                if (attrs.includes('style="')) {
                    return `<${tag}${attrs.replace('style="', `style="${extraStyles} `)}>`;
                }
                return `<${tag} style="${extraStyles}"${attrs}>`;
            });
        };

        injectStyle('p', 'margin-top: 1.1428571em; margin-bottom: 1.1428571em; line-height: 1.7142857; color: #374151;');
        injectStyle('h1', 'margin-top: 0; margin-bottom: 0.8em; line-height: 1.2; font-weight: 800; color: #111827;');
        injectStyle('h2', 'margin-top: 1.6em; margin-bottom: 0.8em; line-height: 1.4; font-weight: 700; color: #111827;');
        injectStyle('h3', 'margin-top: 1.5555556em; margin-bottom: 0.4444444em; line-height: 1.5555556; font-weight: 600; color: #111827;');
        injectStyle('li', 'margin-top: 0.2857143em; margin-bottom: 0.2857143em; padding-left: 0.4285714em; color: #374151;');
        injectStyle('ul', 'list-style-type: disc; padding-left: 1.5rem;');
        injectStyle('ol', 'list-style-type: decimal; padding-left: 1.5rem;');
        injectStyle('strong', 'font-weight: bold;');
        injectStyle('em', 'font-style: italic;');
        injectStyle('u', 'text-decoration: underline;');
        
        // Properly inject image styles without duplicating the style attribute
        injectStyle('img', 'max-width: 100%; height: auto; border-radius: 12px; margin-top: 12px; margin-bottom: 12px; display: block;');

        const plainTextBody = rawContentHtml.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');

        // Professional Email Template
        const finalHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: ${fontStack}; line-height: 1.75; color: #374151; margin: 0; padding: 0; background-color: #f9fafb; font-size: ${fontSize}; }
                    .wrapper { padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
                    .header { background-color: #003087; padding: 40px; text-align: center; }
                    .header h1 { color: #FFD700 !important; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.1em; font-family: 'Poppins', sans-serif !important; }
                    .content { padding: 40px; }
                    .content strong, .content b { font-weight: 600; color: #111827 !important; }
                    .content a { color: #2563eb; text-decoration: underline; font-weight: 500; }
                    .content ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 1.1428571em; margin-bottom: 1.1428571em; }
                    .content ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 1.1428571em; margin-bottom: 1.1428571em; }
                    .footer { background-color: #003087; padding: 30px; text-align: center; color: rgba(255,255,255,0.4); font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; font-family: 'Poppins', sans-serif !important; }
                    @media screen and (max-width: 600px) {
                        .wrapper { padding: 10px !important; }
                        .container { border-radius: 16px !important; }
                        .header { padding: 30px 20px !important; }
                        .content { padding: 30px 20px !important; }
                    }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <h1 style="color: #FFD700; margin: 0; font-size: 24px; font-weight: 900; font-family: 'Poppins', sans-serif;">UPSA</h1>
                        </div>
                        <div class="content" style="padding: 40px; font-family: ${fontStack}; font-size: ${fontSize};">
                            ${contentHtml}
                        </div>
                        <div class="footer">
                            <div style="color: rgba(255,255,255,0.4); font-family: 'Poppins', sans-serif;">
                                UNIVERSITY OF PROFESSIONAL STUDIES, ACCRA<br/>
                                CELEBRATING OUR EXCELLENCE
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `

        let status = 'sent'
        let errorMessage = null

        try {
            const { data, error: resendError } = await resend.emails.send({
                from: 'Birthday Bot <onboarding@resend.dev>',
                reply_to: process.env.EMAIL_REPLY_TO || 'upsavc@upsa.edu.gh',
                to: 'akayetb@gmail.com',
                subject: subject,
                html: finalHtml,
                text: plainTextBody,
                headers: {
                    'X-Birthday-Email-ID': emailId,
                    'track-opens': 'true'
                },
                tags: [
                    { name: 'birthday_email_id', value: emailId }
                ],
                attachments: await Promise.all((template?.attachments || []).map(async (file: any) => {
                    try {
                        const res = await fetch(file.url);
                        const arrayBuffer = await res.arrayBuffer();
                        return {
                            filename: file.name,
                            content: Buffer.from(arrayBuffer),
                        };
                    } catch (e) {
                         console.error(`Failed to download attachment ${file.url}:`, e);
                         return { filename: file.name, path: file.url }
                    }
                })),
            })

            if (resendError) {
                status = 'failed'
                errorMessage = resendError.message
                failedCount++
                console.error(`Resend API Error for ${person.email}:`, resendError)
            } else {
                sentCount++
                status = 'sent'
                console.log(`Resend Success for ${person.email}:`, data?.id)
            }
        } catch (err: any) {
            status = 'failed'
            errorMessage = err.message
            failedCount++
            console.error(`Exception sending email to ${person.email}:`, err)
        }

        // Update the existing record
        if (emailId) {
            await supabaseAdmin
                .from('BirthdayEmail')
                .update({
                    status: status,
                    error: errorMessage,
                    sentAt: new Date().toISOString()
                })
                .eq('id', emailId);
        }
    }

    return {
        success: true,
        count: people.length,
        sent: sentCount,
        skipped: skippedCount,
        failed: failedCount
    }
}
