import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";

function sixDigits(): string {
  // rejection sampling, so every code is equally likely
  const limit = 4_294_000_000; // largest multiple of 1e6 below 2^32
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

function otpProvider(id: string, subject: string) {
  return Email({
    id,
    apiKey: process.env.AUTH_RESEND_KEY,
    maxAge: 60 * 15, // codes expire after 15 minutes
    async generateVerificationToken() {
      return sixDigits();
    },
    async sendVerificationRequest({ identifier: email, provider, token }) {
      // dev fallback: no key set, so the code shows in the `convex dev` terminal
      if (!provider.apiKey) {
        console.log(`[dev] ${subject} code for ${email}: ${token}`);
        return;
      }
      const resend = new ResendAPI(provider.apiKey);
      const { error } = await resend.emails.send({
        from: "Trustik <onboarding@resend.dev>", // change after verifying your domain
        to: [email],
        subject,
        text: `Your Trustik code is ${token}. It expires in 15 minutes. If you didn't ask for it, ignore this email.`,
      });
      if (error) throw new Error(`Could not send email: ${JSON.stringify(error)}`);
    },
  });
}

export const VerifyEmailOTP = otpProvider("verify-email-otp", "Verify your Trustik email");
export const ResetPasswordOTP = otpProvider("reset-password-otp", "Reset your Trustik password");