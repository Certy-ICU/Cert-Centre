"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Trophy, User, Cog, LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileAvatar } from "@/components/gamification/user-profile-avatar";

interface UserAvatarDropdownProps {
  showLevel?: boolean;
}

export const UserAvatarDropdown = ({ 
  showLevel = true 
}: UserAvatarDropdownProps) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [points, setPoints] = useState(0);

  // Fetch user profile to get points data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/gamification/profile");
        if (response.ok) {
          const data = await response.json();
          setPoints(data.points || 0);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSignOut = () => {
    signOut(() => router.push("/"));
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none" asChild>
        <button className="outline-none">
          <UserProfileAvatar
            imageUrl={user.imageUrl}
            username={user.fullName}
            points={points}
            size="md"
            showLevel={showLevel}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start p-2">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{user.fullName || "User"}</p>
            <p className="text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <Link href="/profile">
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/leaderboard">
          <DropdownMenuItem className="cursor-pointer">
            <Trophy className="mr-2 h-4 w-4" />
            <span>Leaderboard</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer">
            <Cog className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-rose-500 focus:text-rose-500">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 