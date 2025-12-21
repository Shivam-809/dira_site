import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendVerificationEmail } from "@/lib/email";
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		}
	}),
	baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	secret: process.env.BETTER_AUTH_SECRET,
	// Enable email verification with Gmail SMTP
	emailAndPassword: {    
		enabled: true,
		requireEmailVerification: true, // Now enabled with Gmail SMTP
		autoSignIn: false, // Users must verify email first
		sendVerificationEmail: async ({ user, url, token }) => {
			console.log('🔔 sendVerificationEmail callback triggered!');
			console.log('📧 Sending verification email to:', user.email);
			console.log('🔗 Base URL:', url);
			console.log('🎫 Token:', token);
			
			try {
				await sendVerificationEmail(user.email, token, url);
				console.log('✅ Verification email sent successfully!');
			} catch (error) {
				console.error('❌ Failed to send verification email:', error);
				throw error;
			}
		},
	},
	// Enable Google OAuth
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	plugins: [bearer()],
	// Include additional user fields in session
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: false,
				defaultValue: "user",
				input: false,
			}
		}
	}
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}