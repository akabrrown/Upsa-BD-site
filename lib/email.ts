import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

// Provide a safe export for build-time static analysis
export const resend = resendApiKey
    ? new Resend(resendApiKey)
    : new Proxy({} as any, {
        get() {
            throw new Error('Resend Client tried to be used but RESEND_API_KEY is missing. Ensure it is set in your environment.')
        }
    })
