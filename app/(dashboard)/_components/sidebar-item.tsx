"use client";

import { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
};

export const SidebarItem = ({
  icon: Icon,
  label,
  href,
}: SidebarItemProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const isActive =
    (pathname === "/" && href === "/") ||
    pathname === href ||
    pathname?.startsWith(`${href}/`);

  const onClick = () => {
    router.push(href);
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "flex items-center gap-x-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-[500] pl-4 sm:pl-6 transition-all hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-300/20 dark:hover:bg-slate-700/20 w-full",
        isActive && "text-sky-700 dark:text-sky-500 bg-sky-200/20 dark:bg-sky-500/10 hover:bg-sky-200/20 dark:hover:bg-sky-500/10 hover:text-sky-700 dark:hover:text-sky-500"
      )}
    >
      <div className="flex items-center gap-x-2 py-3 sm:py-4">
        <Icon
          size={20}
          className={cn(
            "text-slate-500 dark:text-slate-400 min-w-5",
            isActive && "text-sky-700 dark:text-sky-500"
          )}
        />
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "ml-auto opacity-0 border-2 border-sky-700 dark:border-sky-500 h-full transition-all",
          isActive && "opacity-100"
        )}
      />
    </button>
  )
}