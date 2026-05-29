import { Loader2 } from "lucide-react";

export default function MainLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-300">
      <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
      <p className="text-muted-foreground font-semibold text-sm animate-pulse tracking-wide select-none">
        Loading DocSaathi...
      </p>
    </div>
  );
}
