import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/admin/login";

  if (isAdminRoute && !isLoginRoute) {
    // Fail closed: no session, a failed query, or no matching row all
    // redirect to login — never fall through to "allowed" on an error.
    // A logged-in customer (every visitor gets a real auth.uid() via
    // anonymous sign-in for cart identity) satisfies `user` but not the
    // staff lookup, which is the actual gate.
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const { data: staffRow, error } = await supabase
      .from("staff")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !staffRow) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
