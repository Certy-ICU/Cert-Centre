import { NavbarRoutes } from "@/components/navbar-routes"

import { MobileSidebar } from "./mobile-sidebar"

export const Navbar = () => {
  return (
    <div className="p-2 sm:p-4 border-b h-full flex items-center bg-white dark:bg-slate-950 shadow-sm">
      <MobileSidebar />
      <NavbarRoutes />
    </div>
  )
}