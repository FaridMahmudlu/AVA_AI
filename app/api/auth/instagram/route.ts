import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error("Instagram OAuth configurations are missing in .env");
    return NextResponse.json(
      { error: "Instagram client_id veya redirect_uri .env içinde tanımlanmamış." },
      { status: 500 }
    );
  }

  // Instagram Graph API OAuth Authorize URL
  // Scope: user_profile (to get username/ID), user_media (to get posts for Language Fingerprint)
  const instagramAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=user_profile,user_media&response_type=code`;

  return NextResponse.redirect(instagramAuthUrl);
}
