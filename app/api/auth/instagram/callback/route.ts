import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Instagram OAuth Error callback:", error);
    return NextResponse.redirect(new URL("/profile?error=instagram_auth_failed", req.url));
  }

  if (!code) {
    return NextResponse.json({ error: "Authorization code not provided" }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Instagram App credentials not configured in environment." },
      { status: 500 }
    );
  }

  try {
    // 1. Exchange OAuth code for a short-lived token
    const tokenFormData = new FormData();
    tokenFormData.append("client_id", clientId);
    tokenFormData.append("client_secret", clientSecret);
    tokenFormData.append("grant_type", "authorization_code");
    tokenFormData.append("redirect_uri", redirectUri);
    tokenFormData.append("code", code);

    const shortTokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenFormData,
    });

    const shortTokenData = await shortTokenRes.json();
    if (shortTokenData.error) {
      console.error("Error exchanging short-lived token:", shortTokenData.error);
      return NextResponse.redirect(new URL("/profile?error=instagram_token_exchange_failed", req.url));
    }

    const shortLivedToken = shortTokenData.access_token;
    const instagramUserId = shortTokenData.user_id?.toString();

    // 2. Exchange short-lived token for a long-lived access token (60 days)
    const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();

    if (longTokenData.error) {
      console.error("Error exchanging long-lived token:", longTokenData.error);
      return NextResponse.redirect(new URL("/profile?error=instagram_long_token_failed", req.url));
    }

    const longLivedToken = longTokenData.access_token;

    // 3. Optional: Get Instagram profile username
    let instagramUsername = "";
    try {
      const meRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${longLivedToken}`
      );
      const meData = await meRes.json();
      if (meData.username) {
        instagramUsername = meData.username;
      }
    } catch (meError) {
      console.error("Could not fetch Instagram profile username:", meError);
    }

    // 4. Get current user and update database record
    const user = (await getSession()) as any;
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        instagramAccessToken: longLivedToken,
        instagramUserId: instagramUserId || null,
        socialMediaUsername: instagramUsername ? `@${instagramUsername}` : user.socialMediaUsername,
      } as any,
    });

    return NextResponse.redirect(new URL("/profile?success=instagram_connected", req.url));
  } catch (err) {
    console.error("Instagram Callback Exception:", err);
    return NextResponse.redirect(new URL("/profile?error=internal_server_error", req.url));
  }
}
