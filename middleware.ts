import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BOT_UA =
  /bot|crawl|spider|slackbot|twitterbot|facebookexternalhit|telegrambot|discordbot|whatsapp|linkedinbot|embedly|quora|pinterest|preview|fetcher|archive/i;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Only intercept root path with source or target params
  if (url.pathname !== "/") return NextResponse.next();

  const source = url.searchParams.get("source");
  const target = url.searchParams.get("target");
  if (!source && !target) return NextResponse.next();

  const ua = req.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) return NextResponse.next();

  // Rewrite bots to the share API which returns OG-tagged HTML
  const shareUrl = new URL("/api/share", req.url);
  if (source) shareUrl.searchParams.set("source", source);
  if (target) shareUrl.searchParams.set("target", target);

  return NextResponse.rewrite(shareUrl);
}

export const config = {
  matcher: ["/"],
};
