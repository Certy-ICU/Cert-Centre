import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, User } from "lucide-react";

import { getUserProfile } from "@/lib/gamification-service";
import { BadgesDisplay } from "@/components/gamification/badges-display";
import { PointsDisplay } from "@/components/gamification/points-display";
import { UserProfileAvatar } from "@/components/gamification/user-profile-avatar";

const ProfilePage = async () => {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId) {
    return redirect("/");
  }

  const profile = await getUserProfile(userId);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <UserProfileAvatar 
              imageUrl={user?.imageUrl || profile?.imageUrl}
              username={user?.fullName || profile?.username}
              points={profile?.points || 0}
              size="xl"
              showLevel={true}
            />
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-1">{user?.fullName || profile?.username || "User"}</h2>
              <p className="text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
              <div className="mt-2">
                <PointsDisplay points={profile?.points || 0} size="md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Points Overview</CardTitle>
            <CardDescription>Your current points and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <PointsDisplay points={profile?.points || 0} size="lg" />
              
              <div className="text-sm text-muted-foreground mt-4">
                <p>Earn points by:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Completing chapters (10 points)</li>
                  <li>Completing courses (50 bonus points)</li>
                  <li>Posting comments (5 points)</li>
                  <li>Starting discussions (5 points)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>My Badges</CardTitle>
            <CardDescription>Badges you've earned through your achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="earned" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="earned">Earned Badges</TabsTrigger>
                <TabsTrigger value="available">Available Badges</TabsTrigger>
              </TabsList>
              <TabsContent value="earned" className="p-2">
                <BadgesDisplay 
                  earnedBadges={profile?.earnedBadges || []}
                  size="lg"
                  emptyState={
                    <div className="text-center py-6 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
                      <p>You haven't earned any badges yet.</p>
                      <p className="text-sm mt-1">Complete courses and engage with content to earn your first badge!</p>
                    </div>
                  }
                />
              </TabsContent>
              <TabsContent value="available" className="p-2">
                <p className="text-sm text-muted-foreground mb-4">
                  These are badges you can earn by participating in the platform:
                </p>
                <div className="space-y-4">
                  <div className="p-3 border rounded-md">
                    <h3 className="font-medium">First Course Completed</h3>
                    <p className="text-sm text-muted-foreground">Complete all chapters in a course</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <h3 className="font-medium">Knowledge Explorer</h3>
                    <p className="text-sm text-muted-foreground">Complete 5 different courses</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <h3 className="font-medium">Engaged Learner</h3>
                    <p className="text-sm text-muted-foreground">Post your first comment</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <h3 className="font-medium">Fast Learner</h3>
                    <p className="text-sm text-muted-foreground">Complete a course within 24 hours of purchase</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <h3 className="font-medium">Streak Master</h3>
                    <p className="text-sm text-muted-foreground">Log in for 7 consecutive days</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage; 