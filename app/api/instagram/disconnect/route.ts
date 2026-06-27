import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/instagram/disconnect
 * 
 * Disconnects the authenticated user's Instagram account.
 * Clears all Instagram-related fields from the database.
 * 
 * Security:
 * - Requires Clerk authentication
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

    await prisma.user.update({
      where: { id: userId },
      data: {
        instagramUsername: null,
        instagramConnectedAt: null,
        instagramProfileData: null,
        instagramLastSyncAt: null,
      } as any,
    });

    return NextResponse.json({
      ok: true,
      message: "Instagram bağlantısı kaldırıldı.",
    });
  } catch (err) {
    console.error("[Instagram Disconnect Error]", err);
    return NextResponse.json(
      { error: "Bağlantı kesilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
