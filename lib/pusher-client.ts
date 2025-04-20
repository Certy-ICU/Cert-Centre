import PusherClient from "pusher-js";

// Ensure environment variables are loaded correctly client-side
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
  console.error("Pusher client environment variables not set!");
}

export const pusherClient = new PusherClient(
  pusherKey!, 
  {
    cluster: pusherCluster!,
    authEndpoint: "/api/pusher/auth",
  }
); 