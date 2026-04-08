import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET || "";

export const config: NextAuthConfig = {
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!supabaseUrl || !supabaseServiceKey) {
          console.warn("Supabase credentials missing during signIn");
          return true; // Proceed anyway (for local dev without db)
        }
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: existingUser } = await supabase
          .from("users")
          .select("id, display_name, photo_url, plan_name, subscription_status, onboarding_completed, subscription_id")
          .eq("email", user.email)
          .single();

        if (!existingUser) {
          const { data, error } = await supabase
            .from("users")
            .insert({
              google_id: account.providerAccountId,
              email: user.email,
              display_name: user.name,
              photo_url: user.image,
              onboarding_completed: false,
              subscription_status: "trialing",
              plan_name: "Starter"
            })
            .select("id, plan_name, subscription_status, onboarding_completed, subscription_id")
            .single();
            
          if (data) {
             user.id = data.id;
             (user as any).planName = data.plan_name;
             (user as any).subscriptionStatus = data.subscription_status;
             (user as any).onboardingCompleted = data.onboarding_completed;
             (user as any).hasSubscription = !!data.subscription_id;
          } else if (error) {
             console.error("Failed to create user in Supabase:", error);
          }
        } else {
          if (existingUser.display_name !== user.name || existingUser.photo_url !== user.image) {
            await supabase
              .from("users")
              .update({ display_name: user.name, photo_url: user.image })
              .eq("id", existingUser.id);
          }
          user.id = existingUser.id;
          (user as any).planName = existingUser.plan_name;
          (user as any).subscriptionStatus = existingUser.subscription_status;
          (user as any).onboardingCompleted = existingUser.onboarding_completed;
          (user as any).hasSubscription = !!existingUser.subscription_id;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.planName = (user as any).planName;
        token.subscriptionStatus = (user as any).subscriptionStatus;
        token.onboardingCompleted = (user as any).onboardingCompleted;
        token.hasSubscription = (user as any).hasSubscription;
      }
      if (trigger === "update" && session) {
        if (session.planName) token.planName = session.planName;
        if (session.subscriptionStatus) token.subscriptionStatus = session.subscriptionStatus;
        if (session.onboardingCompleted !== undefined) token.onboardingCompleted = session.onboardingCompleted;
        if (session.hasSubscription !== undefined) token.hasSubscription = session.hasSubscription;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      (session.user as any).planName = token.planName as string;
      (session.user as any).subscriptionStatus = token.subscriptionStatus as string;
      (session.user as any).onboardingCompleted = token.onboardingCompleted as boolean;
      (session.user as any).hasSubscription = token.hasSubscription as boolean;
      
      if (supabaseJwtSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.userId as string,
          email: session.user.email as string,
          role: "authenticated",
        };
        const secret = new TextEncoder().encode(supabaseJwtSecret);
        (session as any).supabaseAccessToken = await new SignJWT(payload)
          .setProtectedHeader({ alg: "HS256" })
          .sign(secret);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the user just signed in, check if they completed onboarding
      if (url.startsWith("/api/auth/callback") || url === baseUrl) {
        // Note: We can't access the token directly here in the redirect callback,
        // so the dashboard layout handles the onboarding redirect client-side.
        // But we can handle explicit callbackUrl parameters:
        if (url.includes("callbackUrl=")) {
          try {
            const callbackUrl = new URL(url, baseUrl).searchParams.get("callbackUrl");
            if (callbackUrl && callbackUrl.startsWith("/")) {
              return `${baseUrl}${callbackUrl}`;
            }
          } catch { /* fall through */ }
        }
        return `${baseUrl}/dashboard`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
