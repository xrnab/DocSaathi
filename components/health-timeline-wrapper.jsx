"use client";

import dynamic from "next/dynamic";

const HealthTimeline = dynamic(() => import("./health-timeline"), {
  ssr: false,
});

export default function HealthTimelineWrapper({ visits }) {
  return <HealthTimeline visits={visits} />;
}
