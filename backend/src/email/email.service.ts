import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordChangeNotification(to: string, firstName: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: 'CycloAI - Password Changed',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0A0A0A;color:#fff;border-radius:16px;padding:32px;border:1px solid rgba(255,76,0,0.2);">
          <h1 style="font-size:24px;margin:0 0 8px;color:#FF4C00;">CycloAI</h1>
          <p style="font-size:14px;color:#ccc;margin:0 0 16px;">Hi ${firstName},</p>
          <p style="font-size:14px;color:#aaa;margin:0 0 24px;">Your password was recently changed. If you made this change, you can ignore this email.</p>
          <p style="font-size:12px;color:#666;margin-top:24px;">If you didn't change your password, please contact support immediately.</p>
        </div>
      `,
    });
  }

  async sendOtpEmail(to: string, code: string, type: string): Promise<void> {
    const subject = type === 'password-reset'
      ? 'CycloAI - Password Reset OTP'
      : 'CycloAI - Your Signup OTP';

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0A0A0A;color:#fff;border-radius:16px;padding:32px;border:1px solid rgba(255,76,0,0.2);">
          <h1 style="font-size:24px;margin:0 0 8px;color:#FF4C00;">CycloAI</h1>
          <p style="font-size:14px;color:#aaa;margin:0 0 24px;">Your OTP code is below — it expires in 15 minutes.</p>
          <div style="text-align:center;font-size:36px;letter-spacing:12px;font-weight:700;color:#FF4C00;background:rgba(255,76,0,0.08);border-radius:12px;padding:20px;">${code}</div>
          <p style="font-size:12px;color:#666;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  }
}
