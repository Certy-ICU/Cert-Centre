import Pusher from "pusher";
import { auth } from "@clerk/nextjs";

// Initialize Pusher server instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const authorizeUser = async (socketId: string, channelName: string) => {
  const { userId } = auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Handle presence channels for both chapter-specific and global presence
  if (channelName.startsWith("presence-")) {
    const user = {
      id: userId,
    };

    const authResponse = pusherServer.authorizeChannel(
      socketId,
      channelName,
      { user_id: userId, user_info: user }
    );

    return new Response(JSON.stringify(authResponse));
  }

  // Handle private channels
  if (channelName.startsWith("private-")) {
    const authResponse = pusherServer.authorizeChannel(
      socketId,
      channelName,
      { user_id: userId }
    );

    return new Response(JSON.stringify(authResponse));
  }

  return new Response("Unauthorized", { status: 401 });
}; 