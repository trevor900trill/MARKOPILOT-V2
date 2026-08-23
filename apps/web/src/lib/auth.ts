import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

// M-PESA supported countries (ISO 3166-1 alpha-2 codes)
const MPESA_SUPPORTED_COUNTRIES = new Set([
  "KE", // Kenya
  "TZ", // Tanzania
  "UG", // Uganda
  "RW", // Rwanda
  "ZW", // Zimbabwe
  "ZA", // South Africa
  "MO", // Mozambique
  "SO", // Somalia
  "ET", // Ethiopia
  "CD", // Democratic Republic of Congo
  "GH", // Ghana
  "CM", // Cameroon
  "CI", // Ivory Coast
  "SN", // Senegal
  "ML", // Mali
  "BF", // Burkina Faso
  "NE", // Niger
]);

async function detectCountry(): Promise<{ countryCode: string | null; isSupported: boolean }> {
  try {
    // Get user's IP address (note: this might not work in all environments due to proxies)
    const response = await fetch('https://ipinfo.io/json');
    if (!response.ok) {
      console.warn('Failed to detect country');
      return { countryCode: null, isSupported: false };
    }
    
    const data = await response.json();
    const countryCode = data.country;
    const isSupported = countryCode ? MPESA_SUPPORTED_COUNTRIES.has(countryCode) : false;
    
    return { countryCode, isSupported };
  } catch (error) {
    console.error('Error detecting country:', error);
    return { countryCode: null, isSupported: false };
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET || "";

export const config: NextAuthConfig = {
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: { params: { scope: "openid profile email", prompt: "consent", access_type: "offline", response_type: "code" } },
      checks: ["none"], // Bypasses proxy-dropped cookie issues (PKCE/State verification failures)
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
          .select("id, display_name, photo_url, plan_name, subscription_status, onboarding_completed")
          .eq("email", user.email)
          .single();

        if (!existingUser) {
          // Detect country for new users
          const { countryCode, isSupported } = await detectCountry();
          
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
            .select("id, plan_name, subscription_status, onboarding_completed")
            .single();

          if (data) {
            user.id = data.id;
            (user as any).planName = data.plan_name;
            (user as any).subscriptionStatus = data.subscription_status;
            (user as any).onboardingCompleted = data.onboarding_completed;
            
            // If user is from unsupported region, add to waitlist and set flag
            if (!isSupported && countryCode) {
              // Add to waitlist via API
              try {
                await fetch('/api/users/detect-country', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ipAddress: null }) // Let server detect IP
                });
                (user as any).requiresWaitlist = true;
                (user as any).countryCode = countryCode;
              } catch (waitlistError) {
                console.error('Failed to add to waitlist:', waitlistError);
              }
            }
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
        token.requiresWaitlist = (user as any).requiresWaitlist;
        token.countryCode = (user as any).countryCode;
      }
      if (trigger === "update" && session) {
        if (session.planName) token.planName = session.planName;
        if (session.subscriptionStatus) token.subscriptionStatus = session.subscriptionStatus;
        if (session.onboardingCompleted !== undefined) token.onboardingCompleted = session.onboardingCompleted;
        if (session.requiresWaitlist !== undefined) token.requiresWaitlist = session.requiresWaitlist;
        if (session.countryCode) token.countryCode = session.countryCode;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      (session.user as any).planName = token.planName as string;
      (session.user as any).subscriptionStatus = token.subscriptionStatus as string;
      (session.user as any).onboardingCompleted = token.onboardingCompleted as boolean;
      (session.user as any).requiresWaitlist = token.requiresWaitlist as boolean;
      (session.user as any).countryCode = token.countryCode as string;

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
      // If the user just signed in, check if they completed onboarding or need waitlist
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
