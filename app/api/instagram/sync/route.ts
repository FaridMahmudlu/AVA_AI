import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { scrapeInstagramProfile } from "@/lib/apify";

/**
 * POST /api/instagram/sync
 * 
 * Re-scrapes the connected Instagram profile to refresh data.
 * 
 * Security:
 * - Requires Clerk authentication
 * - Rate limiting (60s cooldown between sync attempts)
 * - Must have a connected Instagram account
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      );
    }

    // Get existing connection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        instagramUsername: true,
        instagramLastSyncAt: true,
      } as any,
    });

    const igUsername = (user as any)?.instagramUsername;
    if (!igUsername) {
      return NextResponse.json(
        { error: "Önce bir Instagram hesabı bağlamanız gerekiyor." },
        { status: 400 }
      );
    }

    // Rate limiting
    const lastSync = (user as any)?.instagramLastSyncAt;
    if (lastSync) {
      const elapsed = Date.now() - new Date(lastSync).getTime();
      if (elapsed < 60_000) {
        const remaining = Math.ceil((60_000 - elapsed) / 1000);
        return NextResponse.json(
          { error: `Lütfen ${remaining} saniye bekleyin ve tekrar deneyin.` },
          { status: 429 }
        );
      }
    }

    // Re-scrape
    const profileData = await scrapeInstagramProfile(igUsername);

    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: {
        instagramProfileData: profileData as any,
        instagramLastSyncAt: new Date(),
        instagramUsername: profileData.username,
      } as any,
    });

    return NextResponse.json({
      ok: true,
      message: "Instagram verileri güncellendi!",
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
    console.error("[Instagram Sync Error]", err);
    return NextResponse.json(
      { error: "Veriler güncellenirken bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
