import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if purchase already exists
    const existingPurchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: params.courseId
        }
      }
    });

    // If purchase exists, return success
    if (existingPurchase) {
      return NextResponse.json({ status: "already_purchased" });
    }

    // If purchase doesn't exist, create it
    // This is a fallback in case the webhook didn't work
    const purchase = await db.purchase.create({
      data: {
        userId,
        courseId: params.courseId
      }
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("[CONFIRM_PURCHASE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 