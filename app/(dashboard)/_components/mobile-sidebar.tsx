import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export const MobileSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden p-2 hover:opacity-75 transition">
        <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-white dark:bg-slate-950 w-72 max-w-[80%]">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}