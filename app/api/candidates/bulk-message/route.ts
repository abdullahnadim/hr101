import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { candidateIds, message, channels } = await request.json();

    if (!candidateIds || candidateIds.length === 0 || !message) {
      return NextResponse.json({ error: 'Missing candidates or message' }, { status: 400 });
    }

    // Fetch the target candidates to get their emails and phone numbers
    const candidates = await prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      select: { id: true, name: true, email: true, phone: true }
    });

    let successCount = 0;

    // Loop through candidates and dispatch via selected channels
    for (const candidate of candidates) {
      const personalizedMessage = message.replace('{{name}}', candidate.name);

      if (channels.includes('EMAIL') && candidate.email) {
        // Plug in your SendGrid or Resend API here in the future
        console.log(`[EMAIL] To ${candidate.email}: ${personalizedMessage}`);
      }
      
      if (channels.includes('SMS') && candidate.phone) {
        // Plug in your Twilio API here in the future
        console.log(`[SMS] To ${candidate.phone}: ${personalizedMessage}`);
      }
      
      if (channels.includes('WHATSAPP') && candidate.phone) {
        // Plug in your Meta WhatsApp API here in the future
        console.log(`[WHATSAPP] To ${candidate.phone}: ${personalizedMessage}`);
      }

      successCount++;
    }

    return NextResponse.json({ success: true, deliveredCount: successCount });
  } catch (error) {
    console.error("Bulk message error:", error);
    return NextResponse.json({ error: 'Failed to send bulk messages' }, { status: 500 });
  }
}