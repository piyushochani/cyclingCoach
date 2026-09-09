import { Injectable, Logger } from '@nestjs/common';

const CLERK_API_BASE = 'https://api.clerk.com/v1';

export interface ClerkOtpRef {
  emailAddressId: string;
  verificationId: string;
}

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUser {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string;
}

@Injectable()
export class ClerkOtpService {
  private readonly logger = new Logger(ClerkOtpService.name);

  private get secretKey(): string {
    return process.env.CLERK_SECRET_KEY || '';
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${CLERK_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const errors = (body as any)?.errors;
      const detail = Array.isArray(errors) && errors.length
        ? `${errors[0]?.code || 'error'}: ${errors[0]?.longMessage || errors[0]?.message || 'unknown'}`
        : JSON.stringify(body);
      throw new Error(`Clerk API ${res.status} on ${path}: ${detail}`);
    }
    return body as T;
  }

  async sendOtp(email: string): Promise<ClerkOtpRef> {
    if (!this.secretKey) {
      throw new Error('CLERK_SECRET_KEY is not configured');
    }
    const emailAddressId = await this.resolveEmailAddressId(email);
    const verification = await this.request<{ id: string; expire_at?: number | null }>(
      `/email_addresses/${emailAddressId}/prepare_verification`,
      { method: 'POST' },
    );
    this.logger.log(
      `Clerk OTP sent for ${email} (email_address=${emailAddressId}, verification=${verification.id})`,
    );
    return { emailAddressId, verificationId: verification.id };
  }

  async verifyOtp(ref: ClerkOtpRef, code: string): Promise<boolean> {
    try {
      const verification = await this.request<{
        id: string;
        status: string;
        strategy: string;
      }>(
        `/email_addresses/${ref.emailAddressId}/attempt_verification`,
        {
          method: 'POST',
          body: JSON.stringify({
            verification_id: ref.verificationId,
            code,
          }),
        },
      );
      if (verification.status === 'verified') return true;
      this.logger.warn(
        `Clerk OTP attempt failed for ${ref.emailAddressId}: status=${verification.status}`,
      );
      return false;
    } catch (err: any) {
      if (String(err.message).includes('verification_already_verified')) {
        return true;
      }
      throw err;
    }
  }

  private async resolveEmailAddressId(email: string): Promise<string> {
    const user = await this.ensureClerkUser(email);
    const addresses = user.email_addresses || [];
    const match = addresses.find(
      (ea) => ea.email_address.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match.id;

    const created = await this.request<ClerkEmailAddress>('/email_addresses', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, email_address: email }),
    });
    return created.id;
  }

  private async ensureClerkUser(email: string): Promise<ClerkUser> {
    const existing = await this.request<ClerkUser[]>(
      `/users?limit=1&email_address[]=${encodeURIComponent(email)}`,
    );
    if (Array.isArray(existing) && existing.length > 0) {
      return existing[0];
    }
    return this.request<ClerkUser>('/users', {
      method: 'POST',
      body: JSON.stringify({
        email_address: [email],
        email_address_identification_status: ['reserved'],
        skip_password_requirement: true,
      }),
    });
  }
}
