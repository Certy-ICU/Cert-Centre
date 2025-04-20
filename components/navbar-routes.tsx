"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { LogOut, Award, Trophy, User } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { isTeacher } from "@/lib/teacher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatarDropdown } from "@/components/gamification/user-avatar-dropdown";
import { ActiveUsersGlobalCounter } from "@/components/ActiveUsersGlobalCounter";

import { SearchInput } from "./search-input";

export const NavbarRoutes = () => {
  const { userId } = useAuth();
  const pathname = usePathname();

  const isTeacherPage = pathname?.startsWith("/teacher");
  const isCoursePage = pathname?.includes("/courses");
  const isSearchPage = pathname === "/search";
  const isVerifyPage = pathname === "/verify-certificate";
  const isProfilePage = pathname === "/profile";
  const isLeaderboardPage = pathname === "/leaderboard";

  return (
    <>
      {isSearchPage && (
        <div className="hidden md:block">
          <SearchInput />
        </div>
      )}
      <div className="flex gap-x-1 sm:gap-x-2 ml-auto items-center">
        <ActiveUsersGlobalCounter />
        
        {!isVerifyPage && (
          <Link href="/verify-certificate">
            <Button size="sm" variant="ghost" className="text-xs sm:text-sm flex items-center">
              <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Verify Certificate</span>
            </Button>
          </Link>
        )}

        {!isLeaderboardPage && (
          <Link href="/leaderboard">
            <Button size="sm" variant="ghost" className="text-xs sm:text-sm flex items-center">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Button>
          </Link>
        )}

        {!isProfilePage && (
          <Link href="/profile">
            <Button size="sm" variant="ghost" className="text-xs sm:text-sm flex items-center">
              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
          </Link>
        )}

        {isTeacherPage || isCoursePage ? (
          <Link href="/">
            <Button size="sm" variant="ghost" className="text-xs sm:text-sm">
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Exit</span>
            </Button>
          </Link>
        ) : isTeacher(userId) ? (
          <Link href="/teacher/courses">
            <Button size="sm" variant="ghost" className="text-xs sm:text-sm">
              Teacher mode
            </Button>
          </Link>
        ) : null}
        <ThemeToggle />
        <UserAvatarDropdown />
      </div>
    </>
  )
}