"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function NabhaFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNabha = searchParams.get("nabha") === "true";

  const handleToggle = () => {
    const params = new URLSearchParams(searchParams);
    if (!isNabha) {
      params.set("nabha", "true");
    } else {
      params.delete("nabha");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <button
      onClick={handleToggle}
      type="button"
      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border-2 transition-all duration-300 select-none ${
        isNabha
          ? "border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 shadow-md shadow-sky-500/10"
          : "border-slate-100 dark:border-slate-800 text-slate-500 hover:border-sky-100 dark:hover:border-sky-950/20"
      }`}
    >
      <span className="text-sm">📍</span>
      <span>Available in Nabha</span>
    </button>
  );
}
