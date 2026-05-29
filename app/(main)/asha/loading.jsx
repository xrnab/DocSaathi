import { Loader2 } from "lucide-react";

export default function AshaLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-center px-4 animate-in fade-in duration-300">
      <Loader2 className="h-10 w-10 animate-spin text-sky-500 mx-auto" />
      <p className="text-muted-foreground font-medium mt-4 animate-pulse">Loading ASHA Dashboard...</p>
    </div>
  );
}
