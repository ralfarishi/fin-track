import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options)
					);
				},
			},
		}
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Public routes that don't require authentication
	const publicRoutes = ["/", "/login", "/auth", "/share"];
	const isPublicRoute =
		publicRoutes.some(
			(route) =>
				request.nextUrl.pathname === route ||
				request.nextUrl.pathname.startsWith("/auth") ||
				request.nextUrl.pathname.startsWith("/share")
		) ||
		// Static files should not be protected
		request.nextUrl.pathname.startsWith("/icons") ||
		request.nextUrl.pathname === "/manifest.json" ||
		request.nextUrl.pathname === "/favicon.ico";

	// Protect dashboard and other private routes
	if (!user && !isPublicRoute) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	// Redirect to dashboard if logged in and trying to access login page
	if (user && request.nextUrl.pathname === "/login") {
		const url = request.nextUrl.clone();
		url.pathname = "/dashboard";
		return NextResponse.redirect(url);
	}

	return response;
}
