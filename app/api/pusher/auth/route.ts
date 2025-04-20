import { NextResponse } from "next/server";
import { authorizeUser } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { socket_id, channel_name } = data;

    if (!socket_id || !channel_name) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    return await authorizeUser(socket_id, channel_name);
  } catch (error) {
    console.error("PUSHER_AUTH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 