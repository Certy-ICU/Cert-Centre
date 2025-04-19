import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

// GET /api/gamification/badges - Get all badges
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const badges = await db.badge.findMany({
      orderBy: {
        tier: "asc" // Order by tier (BRONZE, SILVER, GOLD)
      }
    });
    
    return NextResponse.json(badges);
  } catch (error) {
    console.error("[BADGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/gamification/badges - Create a new badge (admin only)
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const adminCheck = await isAdmin(userId);
    
    if (!adminCheck) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const body = await req.json();
    const { name, description, imageUrl, tier, criteria } = body;
    
    if (!name || !description || !imageUrl || !tier) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Validate tier
    if (!["BRONZE", "SILVER", "GOLD"].includes(tier)) {
      return new NextResponse("Invalid tier. Must be one of: BRONZE, SILVER, GOLD", { status: 400 });
    }
    
    const badge = await db.badge.create({
      data: {
        name,
        description,
        imageUrl,
        tier,
        criteria: criteria || "",
      }
    });
    
    return NextResponse.json(badge);
  } catch (error) {
    console.error("[BADGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PUT /api/gamification/badges/:id - Update a badge (admin only)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const adminCheck = await isAdmin(userId);
    
    if (!adminCheck) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const { id } = params;
    
    const body = await req.json();
    const { name, description, imageUrl, tier, criteria } = body;
    
    // Check if badge exists
    const existingBadge = await db.badge.findUnique({
      where: { id }
    });
    
    if (!existingBadge) {
      return new NextResponse("Badge not found", { status: 404 });
    }
    
    // Update badge
    const badge = await db.badge.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingBadge.name,
        description: description !== undefined ? description : existingBadge.description,
        imageUrl: imageUrl !== undefined ? imageUrl : existingBadge.imageUrl,
        tier: tier !== undefined ? tier : existingBadge.tier,
        criteria: criteria !== undefined ? criteria : existingBadge.criteria,
      }
    });
    
    return NextResponse.json(badge);
  } catch (error) {
    console.error("[BADGES_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/gamification/badges/:id - Delete a badge (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const adminCheck = await isAdmin(userId);
    
    if (!adminCheck) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const { id } = params;
    
    // Check if badge exists
    const existingBadge = await db.badge.findUnique({
      where: { id }
    });
    
    if (!existingBadge) {
      return new NextResponse("Badge not found", { status: 404 });
    }
    
    // Delete all user badges associations first
    await db.userBadge.deleteMany({
      where: { badgeId: id }
    });
    
    // Delete the badge
    await db.badge.delete({
      where: { id }
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[BADGES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 