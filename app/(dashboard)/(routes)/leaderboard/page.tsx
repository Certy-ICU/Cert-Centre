import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLeaderboard } from "@/lib/gamification-service";
import { PointsDisplay } from "@/components/gamification/points-display";
import { UserProfileAvatar } from "@/components/gamification/user-profile-avatar";

const LeaderboardPage = async () => {
  const leaderboard = await getLeaderboard(20);
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
      <p className="text-muted-foreground mb-6">Top learners ranked by points</p>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Top Learners</CardTitle>
          <CardDescription>
            Earn points by completing chapters, courses, and engaging through comments
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
                    {user.earnedBadges.slice(0, 3).map((userBadge) => (
                      <Badge key={userBadge.id} variant="outline" className="text-xs">
                        {userBadge.badge.name}
                      </Badge>
                    ))}
                    {user.earnedBadges.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{user.earnedBadges.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <PointsDisplay points={user.points} className="ml-auto" />
              </div>
            ))}

            {leaderboard.length === 0 && (
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