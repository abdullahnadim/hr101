type CandidateData = Record<string, string | null | undefined>;

export function renderMessageTemplate(template: string, data: CandidateData): string {
  return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return data[trimmedKey] !== undefined && data[trimmedKey] !== null
      ? String(data[trimmedKey])
      : match; // Leave unreplaced if data is missing
  });
}

// Provider Abstraction Interface
export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<boolean>;
}

// Implementation example
export class SMTPProvider implements EmailProvider {
  async send(to: string, subject: string, body: string): Promise<boolean> {
    if (!process.env.SMTP_HOST) {
      console.warn("SMTP not configured. Simulating failure to prevent silent drops.");
      throw new Error("SMTP Provider not configured.");
    }
    // nodemailer logic here
    return true; 
  }
}