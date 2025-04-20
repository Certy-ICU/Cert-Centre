"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserBadge } from "@/components/gamification/user-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge as UiBadge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  tier: "bronze" | "silver" | "gold";
  earned?: boolean;
  earnedDate?: Date;
}

interface ProfileBadgesDisplayProps {
  earnedBadges: Badge[];
  unearnedBadges: Badge[];
  className?: string;
}

export function ProfileBadgesDisplay({
  earnedBadges = [],
  unearnedBadges = [],
  className,
}: ProfileBadgesDisplayProps) {
  const [currentView, setCurrentView] = useState<"earned" | "available">("earned");
  const router = useRouter();
  
  const hasEarnedBadges = earnedBadges.length > 0;
  const hasUnearnedBadges = unearnedBadges.length > 0;
  
  const navigateToBadgesPage = () => {
    router.push("/profile/badges");
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Badges</CardTitle>
            <CardDescription>
              Badges you&apos;ve earned through your learning journey
            </CardDescription>
          </div>
          {hasEarnedBadges && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/badges">
                Manage Badges
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="earned" value={currentView} onValueChange={(v) => setCurrentView(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="earned">Earned</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
          </TabsList>
          
          <TabsContent value="earned">
            {hasEarnedBadges ? (
              <div className="flex flex-wrap gap-4">
                {earnedBadges.slice(0, 6).map((badge) => (
                  <UserBadge 
                    key={badge.id} 
                    badge={badge} 
                    size="md"
                  />
                ))}
                {earnedBadges.length > 6 && (
                  <div className="flex items-center justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={navigateToBadgesPage}
                      className="text-xs"
                    >
                      +{earnedBadges.length - 6} more
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-16 w-16 text-muted-foreground mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a7.454 7.454 0 01-.982-3.172M14.5 4.236a4.001 4.001 0 00-3.5 0 3.995 3.995 0 00-1.123.55m3.246 3.437l6.344 5.399a7.465 7.465 0 00-6.345-4.237 7.464 7.464 0 00-6.344 4.237l6.345-5.399z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">No badges yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Complete courses and activities to earn badges
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="available">
            {hasUnearnedBadges ? (
              <div className="flex flex-wrap gap-4">
                {unearnedBadges.slice(0, 6).map((badge) => (
                  <UserBadge 
                    key={badge.id} 
                    badge={{
                      ...badge,
                      earned: false
                    }} 
                    size="md"
                  />
                ))}
                {unearnedBadges.length > 6 && (
                  <div className="flex items-center justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={navigateToBadgesPage}
                      className="text-xs"
                    >
                      +{unearnedBadges.length - 6} more
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UiBadge className="mb-2">Congratulations!</UiBadge>
                <p className="text-sm text-muted-foreground">
                  You've earned all available badges!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 