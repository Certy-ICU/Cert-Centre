import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLeaderboardByPeriod } from "@/lib/gamification-service";
import { PointsDisplay } from "@/components/gamification/points-display";
import { UserProfileAvatar } from "@/components/gamification/user-profile-avatar";
import { auth } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyncUserButton } from "./_components/sync-user-button";
import { Trophy, Calendar, Clock } from "lucide-react";

const LeaderboardPage = async ({ searchParams }: { searchParams: { period?: string } }) => {
  const { userId } = auth();
  
  // Get period from search params or default to all-time
  const period = searchParams.period || 'all-time';
  
  // Make sure period is valid
  const validPeriod = ['weekly', 'monthly', 'all-time'].includes(period) ? period : 'all-time';
  
  // Fetch leaderboard data for the selected period
  const leaderboard = await getLeaderboardByPeriod(validPeriod, 20);
  
  // Check if current user is an admin (implement proper checks in production)
  const isAdmin = process.env.ADMIN_USER_IDS?.split(",").includes(userId || "");
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">Top learners ranked by points</p>
        </div>
        
        {isAdmin && <SyncUserButton />}
      </div>

      <Tabs defaultValue={validPeriod} className="mb-6">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="all-time" className="flex items-center gap-1.5" asChild>
            <a href="?period=all-time">
              <Trophy className="h-4 w-4" />
              <span>All Time</span>
            </a>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-1.5" asChild>
            <a href="?period=monthly">
              <Clock className="h-4 w-4" />
              <span>This Month</span>
            </a>
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-1.5" asChild>
            <a href="?period=weekly">
              <Calendar className="h-4 w-4" />
              <span>This Week</span>
            </a>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Top Learners</CardTitle>
          <CardDescription>
            {validPeriod === 'weekly' && "Best performers this week"}
            {validPeriod === 'monthly' && "Best performers this month"}
            {validPeriod === 'all-time' && "Best performers of all time"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((user, index) => (
              <div 
                key={user.userId} 
                className="flex items-center p-3 rounded-md border bg-card hover:bg-accent/5 transition"
              >
                <div className="w-8 text-center font-bold text-muted-foreground">
                  {index + 1}
                </div>
                <UserProfileAvatar 
                  imageUrl={user.imageUrl} 
                  username={user.username} 
                  points={user.points}
                  showLevel={true}
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium">{user.username || "User"}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {user.earnedBadges?.slice(0, 3)?.map((userBadge) => (
                      <Badge key={userBadge.id} variant="outline" className="text-xs">
                        {userBadge.badge.name}
                      </Badge>
                    ))}
                    {user.earnedBadges?.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{user.earnedBadges.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <PointsDisplay points={user.points} className="ml-auto" />
              </div>
            ))}

            {(!leaderboard || leaderboard.length === 0) && (
              <div className="text-center py-10 text-muted-foreground">
                <p>No leaderboard data available yet</p>
                <p className="text-sm mt-1">Be the first to earn points and appear on the leaderboard!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage; 