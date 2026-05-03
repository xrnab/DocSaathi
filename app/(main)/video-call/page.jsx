import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getVideoCallSession } from "@/actions/appointments";
import VideoCall from "./video-call-ui";

const BACK_PATHS = {
  appointments: "/appointments",
  doctor: "/doctor",
  telemedicine: "/telemedicine",
};

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  LIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
  EXPIRED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300",
};

export default async function VideoCallPage({ searchParams }) {
  const { appointmentId, from } = await searchParams;
  const backPath = BACK_PATHS[from] || "/appointments";

  if (!appointmentId || Array.isArray(appointmentId)) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Invalid Video Call
        </h1>
        <p className="text-muted-foreground mb-6">
          This video-call link is missing the appointment details we need.
        </p>
        <Button asChild className="bg-sky-600 hover:bg-sky-700">
          <Link href={backPath}>Back</Link>
        </Button>
      </div>
    );
  }

  const session = await getVideoCallSession(appointmentId);

  if (!session.success) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Video Call Unavailable
        </h1>
        <p className="text-muted-foreground mb-6">
          {session.error || "We could not prepare the video call for this appointment."}
        </p>
        <Button asChild className="bg-sky-600 hover:bg-sky-700">
          <Link href={backPath}>Back</Link>
        </Button>
      </div>
    );
  }

  if (session.callStatus !== "LIVE") {
    const statusLabel =
      session.callStatus === "PENDING"
        ? "Pending"
        : session.callStatus === "EXPIRED"
        ? "Expired"
        : "Unknown";

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 justify-center mb-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[session.callStatus] || STATUS_STYLES.EXPIRED}`}
            >
              {statusLabel}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            Video Consultation
          </h1>
          <p className="text-muted-foreground mb-6">
            {session.message || "This call is not available right now."}
          </p>

          <div className="flex justify-center gap-3">
            <Button asChild className="bg-sky-600 hover:bg-sky-700">
              <Link href={backPath}>Back</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <VideoCall
      applicationId={session.applicationId}
      sessionId={session.videoSessionId}
      token={session.token}
      backPath={backPath}
    />
  );
}
