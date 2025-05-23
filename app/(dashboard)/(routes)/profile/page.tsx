import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";
import { getUserProfile } from "@/lib/gamification-service";
import { PointsDisplay } from "@/components/gamification/points-display";
import { UserProfileAvatar } from "@/components/gamification/user-profile-avatar";
import { StreakDisplay } from "@/components/gamification/streak-display";
import { UserBadge } from "@/components/gamification/user-badge";
import { ProfileBadgesDisplay } from "@/components/gamification/profile-badges-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, GitFork } from "lucide-react";
import { db } from "@/lib/db";

const ProfilePage = async () => {
  const { userId } = auth();
  
  if (!userId) {
    return redirect("/sign-in");
  }
  
  const profile = await getUserProfile(userId);
  
  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-2">Profile not found</h1>
          <p className="text-muted-foreground">There was an error loading your profile data</p>
        </div>
      </div>
    );
  }
  
  // Get all badges from the database
  let allBadges = await db.badge.findMany({
    orderBy: {
      tier: "asc"
    }
  });
  
  // If no badges exist at all, fetch from the seed endpoint
  if (allBadges.length === 0) {
    try {
      // Call the seed API to create sample badges
      const seedResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gamification/badges/seed`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (seedResponse.ok) {
        // Refresh the badges list after seeding
        allBadges = await db.badge.findMany({
          orderBy: { tier: "asc" }
        });
      }
    } catch (error) {
      console.error("Failed to seed badges:", error);
    }
  }
  
  // Get user's earned badges IDs for filtering
  const earnedBadgeIds = profile.earnedBadges.map(eb => eb.badge.id);
  
  // Create earned and unearned badge lists
  const earnedBadges = profile.earnedBadges.map(eb => ({
    id: eb.badge.id,
    name: eb.badge.name,
    description: eb.badge.description,
    iconUrl: eb.badge.iconUrl,
    tier: eb.badge.tier as "bronze" | "silver" | "gold",
    earned: true,
    earnedDate: eb.earnedAt
  }));
  
  const unearnedBadges = allBadges
    .filter(badge => !earnedBadgeIds.includes(badge.id))
    .map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl,
      tier: badge.tier as "bronze" | "silver" | "gold",
      earned: false
    }));
  
  // Sort badges by tier (gold, silver, bronze)
  const sortedBadges = [...profile.earnedBadges].sort((a, b) => {
    const tierOrder = { gold: 0, silver: 1, bronze: 2 };
    return (tierOrder[a.badge.tier as keyof typeof tierOrder] || 3) - 
           (tierOrder[b.badge.tier as keyof typeof tierOrder] || 3);
  });
  
  // Featured badges
  const featuredBadges = profile.featuredBadges?.length 
    ? profile.earnedBadges.filter(badge => profile.featuredBadges.includes(badge.badgeId)) 
    : sortedBadges.slice(0, 3);
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <UserProfileAvatar 
                  size="xl"
                  imageUrl={profile.imageUrl} 
                  username={profile.username}
                  points={profile.points}
                  showLevel={true}
                />
                <h2 className="text-xl font-bold mt-4">{profile.username || "User"}</h2>
                <div className="mt-2">
                  <PointsDisplay points={profile.points} size="lg" />
                </div>
                <div className="mt-4 flex justify-center space-x-2">
                  {featuredBadges.slice(0, 3).map(userBadge => (
                    <UserBadge 
                      key={userBadge.id}
                      badge={{
                        id: userBadge.badge.id,
                        name: userBadge.badge.name,
                        description: userBadge.badge.description,
                        iconUrl: userBadge.badge.iconUrl,
                        tier: userBadge.badge.tier
                      }}
                      size="lg"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Streak Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitFork className="h-5 w-5 text-orange-500" />
                Your Streak
              </CardTitle>
              <CardDescription>
                Login daily to maintain your streak and earn rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StreakDisplay 
                currentStreak={profile.currentStreak} 
                longestStreak={profile.longestStreak}
                size="lg" 
              />
              
              <div className="mt-4 text-sm text-muted-foreground space-y-2">
                <p>Streak rewards:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>3 days: Bronze Streak Badge</li>
                  <li>7 days: Silver Streak Badge + 25 points</li>
                  <li>30 days: Gold Streak Badge + 100 points</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="badges">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="badges" className="flex items-center gap-1.5">
                <Award className="h-4 w-4" />
                <span>Badges</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4" />
                <span>Achievements</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="badges" className="mt-6">
              <ProfileBadgesDisplay 
                earnedBadges={earnedBadges}
                unearnedBadges={unearnedBadges}
              />
            </TabsContent>
            
            <TabsContent value="achievements" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Achievements</CardTitle>
                  <CardDescription>
                    Track your progress and accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Course completion */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium">Course Completion</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete courses to earn badges and points
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Bronze (1 course)</span>
                            <span className="text-muted-foreground">0/1 courses</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Silver (5 courses)</span>
                            <span className="text-muted-foreground">0/5 courses</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Gold (10 courses)</span>
                            <span className="text-muted-foreground">0/10 courses</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Engagement */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium">Community Engagement</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Participate in discussions to earn badges and points
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Bronze (1 comment)</span>
                            <span className="text-muted-foreground">0/1 comments</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Silver (10 comments)</span>
                            <span className="text-muted-foreground">0/10 comments</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Gold (50 comments)</span>
                            <span className="text-muted-foreground">0/50 comments</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 