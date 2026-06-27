import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  scrapeInstagramProfile,
  sanitizeInstagramUsername,
  validateInstagramUsername,
} from "@/lib/apify";

/**
 * POST /api/instagram/connect
 * 
 * Connects the authenticated user's Instagram account via Apify scraping.
 * Accepts: { username: string }
 * 
 * Security:
 * - Requires Clerk authentication
 * - Input sanitization and validation
 * - Rate limiting (60s cooldown between connect attempts)
 */
export async function POST(req: Request) {
  try {
    // 1. Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    // 2. Parse and validate input
    const body = await req.json();
    const rawUsername = body.username;

    if (!rawUsername || typeof rawUsername !== "string") {
      return NextResponse.json(
        { error: "Instagram kullanıcı adı gereklidir." },
        { status: 400 }
      );
    }

    const username = sanitizeInstagramUsername(rawUsername);

    if (!validateInstagramUsername(username)) {
      return NextResponse.json(
        {
          error:
            "Geçersiz kullanıcı adı. Sadece harf, rakam, nokta ve alt çizgi kullanılabilir (maks. 30 karakter).",
        },
        { status: 400 }
      );
    }

    // 3. Rate limiting — check last connection attempt
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { instagramConnectedAt: true } as any,
    });

    if (existingUser) {
      const lastConnect = (existingUser as any).instagramConnectedAt;
      if (lastConnect) {
        const elapsed = Date.now() - new Date(lastConnect).getTime();
        if (elapsed < 60_000) {
          const remaining = Math.ceil((60_000 - elapsed) / 1000);
          return NextResponse.json(
            {
              error: `Lütfen ${remaining} saniye bekleyin ve tekrar deneyin.`,
            },
            { status: 429 }
          );
        }
      }
    }

    // 4. Scrape profile via Apify
    const profileData = await scrapeInstagramProfile(username);

    // 5. Save to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        instagramUsername: profileData.username,
        instagramConnectedAt: new Date(),
        instagramProfileData: profileData as any,
        instagramLastSyncAt: new Date(),
        socialMediaUsername: profileData.username,
      } as any,
    });

    return NextResponse.json({
      ok: true,
      message: "Instagram hesabı başarıyla bağlandı!",
      profile: {
        username: profileData.username,
        fullName: profileData.fullName,
        followersCount: profileData.followersCount,
        followsCount: profileData.followsCount,
        postsCount: profileData.postsCount,
        profilePicUrl: profileData.profilePicUrl,
        isVerified: profileData.isVerified,
        biography: profileData.biography,
      },
    });
  } catch (err) {
    console.error("[Instagram Connect Error]", err);

    const message =
      err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.";

    // Map specific errors to user-friendly Turkish messages
    if (message.includes("private account")) {
      return NextResponse.json(
        { error: "Bu hesap gizli (private). Sadece açık hesaplar bağlanabilir." },
        { status: 400 }
      );
    }
    if (message.includes("does not exist")) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı bulunamadı. Lütfen doğru kullanıcı adı girin." },
        { status: 404 }
      );
    }
    if (message.includes("APIFY_API_TOKEN")) {
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası. Lütfen yöneticiyle iletişime geçin." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Instagram bağlantısı sırasında bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
