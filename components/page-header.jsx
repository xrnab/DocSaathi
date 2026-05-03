import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";

/**
 * Reusable page header component with back button and title
 *
 * @param {React.ReactNode} props.icon - Icon component to display next to the title
 * @param {string} props.title - Page title
 * @param {string} props.backLink - URL to navigate back to (defaults to home)
 * @param {string} props.backLabel - Text for the back link (defaults to "Back to Home")
 */
export function PageHeader({
  icon,
  title,
  backLink = "/",
  backLabel = "Back to Home",
}) {
  return (
    <div className="flex flex-col justify-between gap-5 mb-8">
      <Link href={backLink} className="self-start">
        <Button
          variant="outline"
          size="sm"
          className="mb-2 border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 whitespace-nowrap flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>{backLabel}</span>
        </Button>
      </Link>
      <div className="flex items-end gap-2">
        {icon && (
          <div className="text-sky-500">
            {React.cloneElement(icon, {
              className: "h-12 md:h-14 w-12 md:w-14 drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]",
            })}
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-700 dark:from-sky-400 dark:to-blue-500 tracking-tight py-2 leading-[1.2]">
          {title}
        </h1>
      </div>
    </div>
  );
}
