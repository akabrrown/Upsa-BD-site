import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json()

        // Since we don't have an AI key (OpenAI/Gemini), 
        // we use a collection of high-quality pre-written UPSA templates 
        // that mimic "AI generation" for now, or we can use a mock.

        const templates = [
            "Dear [Name],\n\nOn behalf of the University of Professional Studies, Accra (UPSA), we wish you a spectacular birthday! 🎂\n\nYour dedication and contribution to our community are highly valued. May this new year of your life bring you academic and professional excellence, along with boundless joy and fulfillment.\n\nEnjoy your special day!\n\nWarm regards,\nUPSA Management",

            "Happy Birthday, [Name]! 🎉\n\nThe UPSA family celebrates with you today. As you mark another year of growth and achievement, we hope your day is as bright as your future. \n\nMay this year be filled with breakthrough moments and countless reasons to smile. Stay inspired and keep reaching for the stars!\n\nBest wishes,\nUniversity of Professional Studies, Accra",

            "Celebrating [Name] today! 🎈\n\nHappy Birthday from all of us at UPSA. We are proud to have you as part of our vibrant community. May your day be filled with laughter, love, and your favorite treats.\n\nWe look forward to witnessing your continued success in the coming year.\n\nCheers to a great year ahead!",

            "Dear [Name], \n\nA very Happy Birthday to you! 🎁\n\nUniversity of Professional Studies, Accra congratulates you on this milestone. We hope you take today to reflect on your achievements and celebrate the person you've become. \n\nWishing you health, happiness, and prosperity in all your endeavors!"
        ]

        const randomTemplate = templates[Math.floor(Math.random() * templates.length)]

        // Artificial delay to simulate "thinking"
        await new Promise(resolve => setTimeout(resolve, 1500))

        return NextResponse.json({ text: randomTemplate })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
