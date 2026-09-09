import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.error(
        'SMTP_HOST / SMTP_USER / SMTP_PASS are missing. Email sending will not work.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    this.logger.log(`SMTP EmailService configured for ${host}:${port}`);
  }

  onModuleInit() {
    this.logger.log(
      `EMAIL_FROM: ${process.env.EMAIL_FROM || process.env.SMTP_USER || 'NOT CONFIGURED'}`,
    );
  }

  private getFromAddress(): string {
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    if (!from) {
      throw new Error(
        'EMAIL_FROM or SMTP_USER environment variable is not configured.',
      );
    }
    return from;
  }

  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP transporter is not configured.');
    }
    const info = await this.transporter.sendMail({
      from: this.getFromAddress(),
      to,
      subject,
      html,
    });
    this.logger.log(
      `Email sent to ${to} via SMTP. Message ID: ${info.messageId}`,
    );
  }

  async sendPasswordChangeNotification(
    to: string,
    firstName: string,
  ): Promise<void> {
    this.logger.log(`Sending password change notification to: ${to}`);

    await this.sendMail(
      to,
      'CyclogenAI - Password Changed',
      `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0A0A0A;color:#fff;border-radius:16px;padding:32px;border:1px solid rgba(255,76,0,0.2);">
          <h1 style="font-size:24px;margin:0 0 8px;color:#FF4C00;">
            CyclogenAI
          </h1>

          <p style="font-size:14px;color:#ccc;margin:0 0 16px;">
            Hi ${firstName},
          </p>

          <p style="font-size:14px;color:#aaa;margin:0 0 24px;">
            Your password was recently changed. If you made this change,
            you can ignore this email.
          </p>

          <p style="font-size:12px;color:#666;margin-top:24px;">
            If you didn't change your password, please contact support immediately.
          </p>
        </div>
      `,
    );
  }

  async sendOtpEmail(
    to: string,
    code: string,
    type: string,
  ): Promise<void> {
    this.logger.log('======================================');
    this.logger.log('OTP EMAIL REQUEST RECEIVED');
    this.logger.log(`Recipient: ${to}`);
    this.logger.log(`OTP Type: ${type}`);
    this.logger.log('Sending email through SMTP...');
    this.logger.log('======================================');

    const subject =
      type === 'password-reset'
        ? 'CyclogenAI - Password Reset OTP'
        : 'CyclogenAI - Your Signup OTP';

    await this.sendMail(
      to,
      subject,
      `
        <div style="
          font-family:sans-serif;
          max-width:480px;
          margin:0 auto;
          background:#0A0A0A;
          color:#fff;
          border-radius:16px;
          padding:32px;
          border:1px solid rgba(255,76,0,0.2);
        ">
          <h1 style="
            font-size:24px;
            margin:0 0 8px;
            color:#FF4C00;
          ">
            CyclogenAI
          </h1>

          <p style="
            font-size:14px;
            color:#aaa;
            margin:0 0 24px;
          ">
            Your OTP code is below — it expires in 15 minutes.
          </p>

          <div style="
            text-align:center;
            font-size:36px;
            letter-spacing:12px;
            font-weight:700;
            color:#FF4C00;
            background:rgba(255,76,0,0.08);
            border-radius:12px;
            padding:20px;
          ">
            ${code}
          </div>

          <p style="
            font-size:12px;
            color:#666;
            margin-top:24px;
          ">
            If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    );

    this.logger.log('======================================');
    this.logger.log('OTP EMAIL SENT SUCCESSFULLY');
    this.logger.log('======================================');
  }
}
