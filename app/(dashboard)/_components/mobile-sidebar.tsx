"use client";

import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useEffect, useState } from "react";

export const MobileSidebar = () => {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger className="md:hidden touch-target p-2 hover:opacity-75 transition rounded-md">
        <Menu className="h-5 w-5 xs:h-6 xs:w-6" />
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="p-0 bg-white dark:bg-slate-950 w-[280px] xs:w-[320px] max-w-[85%] border-r-2"
      >
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}