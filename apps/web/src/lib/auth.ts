import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET || "";

export const config: NextAuthConfig = {
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
          .select("id, display_name, photo_url, plan_name, subscription_status")
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
            .select("id, plan_name, subscription_status")
            .single();
            
          if (data) {
             user.id = data.id;
             (user as any).planName = data.plan_name;
             (user as any).subscriptionStatus = data.subscription_status;
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
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id;
        token.planName = (user as any).planName;
        token.subscriptionStatus = (user as any).subscriptionStatus;
      }
      if (trigger === "update" && session) {
        if (session.planName) token.planName = session.planName;
        if (session.subscriptionStatus) token.subscriptionStatus = session.subscriptionStatus;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      (session.user as any).planName = token.planName as string;
      (session.user as any).subscriptionStatus = token.subscriptionStatus as string;
      
      if (supabaseJwtSecret) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.userId,
          email: session.user.email,
          role: "authenticated",
        };
        (session as any).supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
      }
      return session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
