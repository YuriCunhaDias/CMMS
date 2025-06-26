import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "c0c11c04-8a21-49c1-9e34-5de52d318d8a");
  requestHeaders.set("x-createxyz-project-group-id", "b120b5fe-6aa5-4197-a772-4f6c7e516ea3");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}