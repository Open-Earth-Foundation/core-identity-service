import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

export type OutboundMail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/** In-memory sink used by tests and when SMTP is not configured. */
export const mailSink: OutboundMail[] = [];

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

/**
 * Sends mail directly from the identity service. When SMTP is unset, messages
 * go to `mailSink` and are logged without the recipient address.
 */
export default class MailService {
  public static async send(mail: OutboundMail): Promise<void> {
    if (!smtpConfigured() || process.env.NODE_ENV === "test") {
      mailSink.push(mail);
      logger.info({ subject: mail.subject }, "Mail sunk (no SMTP / test)");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  }

  public static clearSink(): void {
    mailSink.length = 0;
  }
}
