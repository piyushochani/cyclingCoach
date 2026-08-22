import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true';

    this.logger.log('Initializing SMTP transporter...');
    this.logger.log(`SMTP_HOST: ${host}`);
    this.logger.log(`SMTP_PORT: ${port}`);
    this.logger.log(`SMTP_SECURE: ${secure}`);

    // Never print the actual password
    this.logger.log(
      `SMTP_USER configured: ${process.env.SMTP_USER ? 'YES' : 'NO'}`,
    );

    this.logger.log(
      `SMTP_PASS configured: ${process.env.SMTP_PASS ? 'YES' : 'NO'}`,
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },

      // Helpful debugging logs
      logger: true,
      debug: true,

      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  /**
   * Runs when the NestJS application starts.
   * Tests whether Render can connect to the SMTP server.
   */
  async onModuleInit() {
    this.logger.log('Verifying SMTP connection...');

    try {
      await this.transporter.verify();

      this.logger.log(
        'SMTP CONNECTION SUCCESSFUL - Email service is ready!',
      );
    } catch (error) {
      this.logger.error(
        'SMTP CONNECTION FAILED',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendPasswordChangeNotification(
    to: string,
    firstName: string,
  ): Promise<void> {
    this.logger.log(
      `Attempting password change notification to: ${to}`,
    );

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject: 'CyclogenAI - Password Changed',

        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0A0A0A;color:#fff;border-radius:16px;padding:32px;">
            <h1 style="color:#FF4C00;">CyclogenAI</h1>

            <p>Hi ${firstName},</p>

            <p>
              Your password was recently changed.
              If you made this change, you can ignore this email.
            </p>

            <p>
              If you didn't change your password,
              please contact support immediately.
            </p>
          </div>
        `,
      });

      this.logger.log(
        `Password change email accepted by SMTP server.`,
      );

      this.logger.log(`Message ID: ${info.messageId}`);
      this.logger.log(`SMTP Response: ${info.response}`);
    } catch (error) {
      this.logger.error(
        `FAILED to send password change email to ${to}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  async sendOtpEmail(
    to: string,
    code: string,
    type: string,
  ): Promise<void> {
    this.logger.log('====================================');
    this.logger.log('OTP EMAIL REQUEST RECEIVED');
    this.logger.log(`Recipient: ${to}`);
    this.logger.log(`OTP type: ${type}`);
    this.logger.log(
      `SMTP user exists: ${process.env.SMTP_USER ? 'YES' : 'NO'}`,
    );
    this.logger.log(
      `SMTP password exists: ${process.env.SMTP_PASS ? 'YES' : 'NO'}`,
    );
    this.logger.log('Calling Nodemailer sendMail...');
    this.logger.log('====================================');

    const subject =
      type === 'password-reset'
        ? 'CyclogenAI - Password Reset OTP'
        : 'CyclogenAI - Your Signup OTP';

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,

        html: `
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
      });

      this.logger.log('====================================');
      this.logger.log('OTP EMAIL SUCCESSFULLY SENT');
      this.logger.log(`Message ID: ${info.messageId}`);
      this.logger.log(`SMTP Response: ${info.response}`);
      this.logger.log(
        `Accepted recipients: ${JSON.stringify(info.accepted)}`,
      );
      this.logger.log(
        `Rejected recipients: ${JSON.stringify(info.rejected)}`,
      );
      this.logger.log('====================================');
    } catch (error) {
      this.logger.error('====================================');
      this.logger.error('OTP EMAIL FAILED');

      if (error instanceof Error) {
        this.logger.error(`Error name: ${error.name}`);
        this.logger.error(`Error message: ${error.message}`);
        this.logger.error(`Error stack: ${error.stack}`);
      } else {
        this.logger.error(String(error));
      }

      this.logger.error('====================================');

      // IMPORTANT:
      // Throw the error so the controller knows the email failed.
      throw error;
    }
  }
}