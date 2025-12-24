"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { logSecurityEvent } from "@/lib/security-logger";

export async function login(formData: FormData) {
	try {
		const cookieStore = await cookies();
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		if (!email || !password) {
			return { error: "Please enter your email and password" };
		}

		// Rate limit by email to prevent brute-force attacks
		const rateLimitKey = `login:${email.toLowerCase()}`;
		const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.LOGIN);

		if (!rateLimit.allowed) {
			logSecurityEvent("auth.login.failed", {
				email,
				reason: "rate_limited",
			});
			const waitSeconds = Math.ceil(rateLimit.resetInMs / 1000);
			return { error: `Too many attempts. Please wait ${waitSeconds} seconds.` };
		}

		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						try {
							cookiesToSet.forEach(({ name, value, options }) =>
								cookieStore.set(name, value, options)
							);
						} catch {
							// Server Component context - ignore
						}
					},
				},
			}
		);

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			logSecurityEvent("auth.login.failed", {
				email,
				reason: error.message.includes("Invalid login credentials")
					? "invalid_credentials"
					: error.message,
			});

			// Map Supabase errors to user-friendly messages
			if (error.message.includes("Invalid login credentials")) {
				return { error: "Incorrect email or password. Please try again." };
			}
			if (error.message.includes("Email not confirmed")) {
				return { error: "Please verify your email address to continue." };
			}
			return { error: "Unable to sign in. Please try again." };
		}

		logSecurityEvent("auth.login.success", {
			userId: data.user?.id,
			email,
		});

		revalidatePath("/", "layout");
		redirect("/dashboard");
	} catch (error) {
		// Handle redirect error (not actually an error)
		if (error instanceof Error && error.message === "NEXT_REDIRECT") {
			throw error;
		}
		console.error("Login error:", error);
		return { error: "Something went wrong. Please try again." };
	}
}
