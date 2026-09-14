import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { candidateId, email, phone, subject, emailBody, smsBody } = await request.json();
    
    let emailSuccess = false;
    let smsSuccess = false;

    // 1. Dispatch Email via Resend
    if (process.env.RESEND_API_KEY) {
      const { error } = await resend.emails.send({
        from: 'HR Team <onboarding@resend.dev>', // Replace with your verified domain later
        to: email,
        subject: subject,
        text: emailBody,
      });
      if (!error) emailSuccess = true;
    }

    // 2. Dispatch SMS via Textbee
    if (process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID) {
      const smsRes = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.TEXTBEE_API_KEY,
        },
        body: JSON.stringify({
          receivers: [phone],
          smsBody: smsBody,
        }),
      });
      if (smsRes.ok) smsSuccess = true;
    }

    // 3. Update the Database Status
    let messageStatus = 'NOT_SENT';
    if (emailSuccess && smsSuccess) messageStatus = 'BOTH';
    else if (emailSuccess) messageStatus = 'EMAIL_SENT';
    else if (smsSuccess) messageStatus = 'SMS_SENT';

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { messageStatus }
    });

    return NextResponse.json({ success: true, emailSuccess, smsSuccess });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}