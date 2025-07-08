import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
// import { RequestTracker } from './config/Track/requestTrack';
import { NextRequest, NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/']);
// const requestTracker = new RequestTracker();

export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // Avoid redirecting for API routes, static files, or the subscription page itself
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next/static') ||
    request.nextUrl.pathname.startsWith('/_next/image') ||
    request.nextUrl.pathname.includes('.') ||
    request.nextUrl.pathname === '/subscription'
  ) {
    return NextResponse.next();
  }

  // const { userId } = await auth();
  // if (userId) {
  //   try {
  //     const userStatus = await requestTracker.getUserRequestStatus(userId);

  //     if (!userStatus.isSubscribed && userStatus.requestCount >= 5) {
  //       // Redirect to subscription page if user is not subscribed and has exceeded request limit
  //       return NextResponse.redirect(new URL('/subscription', request.url));
  //     }
  //   } catch (error) {
  //     console.error('Error in middleware checking user request status:', error);
  //     // Fallback to allowing the request if there's an error
  //     return NextResponse.next();
  //   }
  // }

  return NextResponse.next();
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}