import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if user is accessing root path
  if (pathname === '/') {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect /admin to /admin/dashboard if accessing admin root
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  
  // Redirect /mahasiswa to /mahasiswa/home if accessing mahasiswa root  
  if (pathname === '/mahasiswa') {
    return NextResponse.redirect(new URL('/mahasiswa/home', request.url));
  }
  
  // For other paths, let individual pages handle authentication
  // Each page checks localStorage.getItem('jwt_token') for authentication
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin', '/mahasiswa', '/admin/:path*', '/mahasiswa/:path*'],
};