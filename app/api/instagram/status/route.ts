import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/instagram/status
 * 
 * Returns the current Instagram connection status for the authenticated user.
 * Used by client components (navbar, profile) to check connection state.
 * 
 * Security:
 * - Requires Clerk authentication
 * - Only returns non-sensitive profile summary data
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { connected: false },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        instagramUsername: true,
        instagramConnectedAt: true,
        instagramProfileData: true,
        instagramLastSyncAt: true,
      } as any,
    });

    if (!user || !(user as any).instagramUsername) {
      return NextResponse.json({ connected: false });
    }

    const profileData = (user as any).instagramProfileData as any;

    return NextResponse.json({
      connected: true,
      username: (user as any).instagramUsername,
      connectedAt: (user as any).instagramConnectedAt,
      lastSyncAt: (user as any).instagramLastSyncAt,
      profile: profileData
        ? {
            fullName: profileData.fullName || "",
            followersCount: profileData.followersCount || 0,
            followsCount: profileData.followsCount || 0,
            postsCount: profileData.postsCount || 0,
            profilePicUrl: profileData.profilePicUrl || "",
            isVerified: profileData.isVerified || false,
            biography: profileData.biography || "",
          }
        : null,
    });
  } catch (err) {
    console.error("[Instagram Status Error]", err);
    return NextResponse.json({ connected: false });
  }
}
