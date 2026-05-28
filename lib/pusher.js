import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

// Client-side Pusher instance helper (client component safe singleton)
let pusherClientInstance = null;

export function getPusherClient() {
  if (typeof window === "undefined") return null;

  if (!pusherClientInstance) {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      console.warn("Pusher client key missing (NEXT_PUBLIC_PUSHER_KEY is not defined)");
    }
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
      }
    );
  }

  return pusherClientInstance;
}
