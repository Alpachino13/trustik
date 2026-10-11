import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ResetPasswordOTP, VerifyEmailOTP } from "./services/emailCodes";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      verify: VerifyEmailOTP,
      reset: ResetPasswordOTP,
      profile(params) {
        const firstName = String(params.firstName ?? "").trim();
        const lastName = String(params.lastName ?? "").trim();
        return {
          email: String(params.email ?? "").trim().toLowerCase(),
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          role: "user" as const,
          kycStatus: "none" as const,
        };
      },
    }),
  ],
});