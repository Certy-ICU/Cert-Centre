import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  console.log("Webhook received");
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log("Webhook verified, event type:", event.type);
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session?.metadata?.userId;
  const courseId = session?.metadata?.courseId;

  console.log("Webhook metadata:", { userId, courseId });

  if (event.type === "checkout.session.completed") {
    if (!userId || !courseId) {
      console.error("Missing metadata in webhook");
      return new NextResponse(`Webhook Error: Missing metadata`, { status: 400 });
    }

    try {
      // Check if purchase already exists to avoid duplicates
      const existingPurchase = await db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });

      if (existingPurchase) {
        console.log("Purchase already exists:", existingPurchase.id);
        return new NextResponse(null, { status: 200 });
      }

      const purchase = await db.purchase.create({
        data: {
          courseId: courseId,
          userId: userId,
        }
      });
      console.log("Purchase created:", purchase.id);
    } catch (error) {
      console.error("Error creating purchase:", error);
      return new NextResponse(`Error creating purchase record`, { status: 500 });
    }
  } else {
    console.log(`Unhandled event type: ${event.type}`);
    return new NextResponse(null, { status: 200 });
  }

  return new NextResponse(null, { status: 200 });
}