import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Let the setup screen render before environment variables are configured.
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: ((cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      }) satisfies SetAllCookies,
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthPage = request.nextUrl.pathname === "/auth";
  const isPublicFile = request.nextUrl.pathname.startsWith("/_next") || request.nextUrl.pathname.includes(".");

  if (!user && !isAuthPage && !request.nextUrl.pathname.startsWith("/api") && !isPublicFile) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (user && isAuthPage) return NextResponse.redirect(new URL("/closet", request.url));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
