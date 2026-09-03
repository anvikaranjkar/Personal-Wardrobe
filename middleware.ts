import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lqfkkjdwrzucvqxhfkar.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_lUS36BDVXAHjJ-p9bsEraA_sGo-3jJ_";

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
  if (!user) {
    // Create a private Supabase identity without showing login or signup UI.
    // The resulting session is stored in secure cookies and reused on later visits.
    const { error } = await supabase.auth.signInAnonymously();
    if (error) console.error("Anonymous wardrobe session could not be created", error.message);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
