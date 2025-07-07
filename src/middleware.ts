import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSubdomainFromHost, isValidRestaurantSubdomain } from "@/utils/restaurant";

// Admin routes that should not be affected by subdomain routing
const ADMIN_ROUTES = ["/admin", "/api", "/_next", "/favicon.ico"];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";
  
  console.log("🌐 Middleware - Processing:", hostname, url.pathname);

  // Handle admin routes - redirect subdomain admin access to main domain
  if (url.pathname.startsWith("/admin")) {
    const subdomain = extractSubdomainFromHost(hostname);
    if (subdomain) {
      console.log("🔄 Redirecting admin route from subdomain to main domain");
      const mainDomainUrl = new URL(request.url);
      mainDomainUrl.hostname = hostname.replace(`${subdomain}.`, '');
      return NextResponse.redirect(mainDomainUrl);
    }
    console.log("⏭️ Allowing admin route on main domain");
    return NextResponse.next();
  }

  // Skip middleware for API routes and static files
  if (ADMIN_ROUTES.some(route => url.pathname.startsWith(route))) {
    console.log("⏭️ Skipping middleware for static route");
    return NextResponse.next();
  }

  // Extract subdomain from hostname
  const subdomain = extractSubdomainFromHost(hostname);
  console.log("🏪 Extracted subdomain:", subdomain);

  // If we have a potential restaurant subdomain, validate it
  if (subdomain) {
    const isValid = await isValidRestaurantSubdomain(subdomain);
    console.log("✅ Subdomain validation:", subdomain, "->", isValid);
    
    if (isValid) {
      // Check if we're already on the correct route
      if (url.pathname === `/${subdomain}` || url.pathname.startsWith(`/${subdomain}/`)) {
        console.log("✅ Already on correct subdomain route");
        return NextResponse.next();
      }

      // If we're on the root path, rewrite to the subdomain route
      if (url.pathname === "/" || url.pathname === "") {
        console.log("🔄 Rewriting root to subdomain route:", `/${subdomain}${url.search}`);
        url.pathname = `/${subdomain}`;
        return NextResponse.rewrite(url);
      }

      // For other paths, prepend the subdomain
      console.log("🔄 Rewriting path with subdomain:", `/${subdomain}${url.pathname}${url.search}`);
      url.pathname = `/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // If no valid subdomain, allow normal routing
  console.log("🚫 No valid subdomain found, continuing normally");
  return NextResponse.next();
}



// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - admin (admin routes)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|admin).*)",
  ],
}; 