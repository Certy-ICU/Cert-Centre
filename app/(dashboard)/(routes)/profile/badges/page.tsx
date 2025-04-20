"use client";

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { UserBadge } from '@/components/gamification/user-badge';
import { Loader2, InfoIcon, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  tier: 'bronze' | 'silver' | 'gold';
}

interface UserBadgeType {
  id: string;
  badgeId: string;
  isFavorite: boolean;
  displayColor: string | null;
  earnedDate: Date;
  badge: Badge;
}

interface BadgeWithStatus extends Badge {
  earned: boolean;
  earnedDate: Date | null;
}

export default function BadgeManagementPage() {
  const [badges, setBadges] = useState<UserBadgeType[]>([]);
  const [featuredBadges, setFeaturedBadges] = useState<UserBadgeType[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('all');
  const [viewMode, setViewMode] = useState('earned');
  
  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      try {
        // Fetch profile with earned badges
        const profileRes = await fetch('/api/gamification/profile');
        const profileData = await profileRes.json();
        
        setBadges(profileData.earnedBadges || []);
        setFeaturedBadges(profileData.featuredBadges || []);
        
        // Fetch all badges with earned status
        const allBadgesRes = await fetch('/api/gamification/badges/with-status');
        const allBadgesData = await allBadgesRes.json();
        
        setAllBadges(allBadgesData || []);
      } catch (error) {
        console.error("Failed to load badges:", error);
        toast.error("Failed to load badges");
      } finally {
        setLoading(false);
      }
    };
    
    fetchBadges();
  }, []);
  
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // If the source and destination are the same, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Moving within featured badges list
    if (source.droppableId === 'featured-badges' && destination.droppableId === 'featured-badges') {
      const newFeaturedBadges = Array.from(featuredBadges);
      const [movedItem] = newFeaturedBadges.splice(source.index, 1);
      newFeaturedBadges.splice(destination.index, 0, movedItem);
      
      setFeaturedBadges(newFeaturedBadges);
    }
    // Moving from all badges to featured badges
    else if (source.droppableId === 'all-badges' && destination.droppableId === 'featured-badges') {
      const sourceId = badges[source.index].id;
      const badgeToAdd = badges.find(b => b.id === sourceId);
      
      if (!badgeToAdd) return;
      
      // Check if badge is already in featured badges
      if (featuredBadges.some(b => b.id === badgeToAdd.id)) {
        toast.error("This badge is already featured");
        return;
      }
      
      // Check if we've reached the max of 5 featured badges
      if (featuredBadges.length >= 5) {
        toast.error("You can only feature up to 5 badges");
        return;
      }
      
      setFeaturedBadges([...featuredBadges, badgeToAdd]);
    }
    // Remove from featured badges
    else if (source.droppableId === 'featured-badges' && destination.droppableId === 'all-badges') {
      const newFeaturedBadges = Array.from(featuredBadges);
      newFeaturedBadges.splice(source.index, 1);
      setFeaturedBadges(newFeaturedBadges);
    }
  };
  
  const saveFeaturedBadges = async () => {
    try {
      const res = await fetch('/api/users/badges/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeIds: featuredBadges.map(b => b.badgeId) })
      });
      
      if (res.ok) {
        toast.success("Featured badges updated!");
      } else {
        toast.error("Failed to update badges");
      }
    } catch (error) {
      console.error("Error saving badges:", error);
      toast.error("Error saving badges");
    }
  };
  
  const toggleFavorite = async (badgeId: string, isFavorite: boolean) => {
    try {
      const res = await fetch(`/api/users/badges/${badgeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !isFavorite })
      });
      
      if (res.ok) {
        const updatedBadge = await res.json();
        
        // Update badges list
        const updatedBadges = badges.map(badge => 
          badge.id === updatedBadge.id ? { ...badge, isFavorite: updatedBadge.isFavorite } : badge
        );
        setBadges(updatedBadges);
        
        // Update featured badges if necessary
        const updatedFeatured = featuredBadges.map(badge => 
          badge.id === updatedBadge.id ? { ...badge, isFavorite: updatedBadge.isFavorite } : badge
        );
        setFeaturedBadges(updatedFeatured);
        
        toast.success(updatedBadge.isFavorite ? "Added to favorites" : "Removed from favorites");
      }
    } catch (error) {
      console.error("Error updating badge favorite status:", error);
      toast.error("Failed to update badge");
    }
  };
  
  const filterBadgesByTier = (tier: string) => {
    if (tier === 'all') {
      return viewMode === 'earned' 
        ? badges 
        : allBadges.filter(badge => !badge.earned);
    }
    
    return viewMode === 'earned'
      ? badges.filter(badge => badge.badge.tier === tier)
      : allBadges.filter(badge => !badge.earned && badge.tier === tier);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Badge Management</h1>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Badges</CardTitle>
                    <Tabs defaultValue="earned" value={viewMode} onValueChange={setViewMode} className="mt-2">
                      <TabsList className="mb-4">
                        <TabsTrigger value="earned">Earned</TabsTrigger>
                        <TabsTrigger value="available">Available</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px]">
                        <p>
                          {viewMode === 'earned' 
                            ? "Drag badges to the Featured Badges section to display them on your profile."
                            : "These badges are available to earn through your activities on the platform."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription>
                  {viewMode === 'earned' 
                    ? "Drag badges to the right to feature them on your profile"
                    : "Complete activities to unlock these badges"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="bronze">Bronze</TabsTrigger>
                    <TabsTrigger value="silver">Silver</TabsTrigger>
                    <TabsTrigger value="gold">Gold</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={currentTab}>
                    {viewMode === 'earned' ? (
                      <Droppable droppableId="all-badges" direction="horizontal" isDropDisabled={false}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="flex flex-wrap gap-4 min-h-[150px]"
                          >
                            {filterBadgesByTier(currentTab).map((badge, index) => (
                              <Draggable 
                                key={badge.id} 
                                draggableId={badge.id} 
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="badge-item"
                                  >
                                    <UserBadge 
                                      badge={badge.badge} 
                                      size="md"
                                      customization={{
                                        isFavorite: badge.isFavorite,
                                        displayColor: badge.displayColor
                                      }}
                                      onCustomize={() => toggleFavorite(badge.id, badge.isFavorite)}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {filterBadgesByTier(currentTab).length === 0 && (
                              <p className="text-sm text-muted-foreground">
                                {currentTab === 'all' 
                                  ? "You haven't earned any badges yet." 
                                  : `You haven't earned any ${currentTab} badges yet.`}
                              </p>
                            )}
                          </div>
                        )}
                      </Droppable>
                    ) : (
                      // Display unearned badges (not draggable)
                      <div className="flex flex-wrap gap-4 min-h-[150px]">
                        {filterBadgesByTier(currentTab).map((badge) => (
                          <div key={badge.id} className="badge-item">
                            <UserBadge 
                              badge={{
                                ...badge,
                                earned: false
                              }}
                              size="md"
                            />
                          </div>
                        ))}
                        {filterBadgesByTier(currentTab).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            {currentTab === 'all' 
                              ? "No more badges to earn in this category!" 
                              : `No more ${currentTab} badges to earn!`}
                          </p>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Featured Badges</CardTitle>
                <CardDescription>
                  Up to 5 badges to display on your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Droppable droppableId="featured-badges" direction="horizontal">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="min-h-[200px] border-2 border-dashed rounded-md p-4 flex flex-wrap gap-4"
                    >
                      {featuredBadges.map((badge, index) => (
                        <Draggable key={badge.id} draggableId={`featured-${badge.id}`} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <UserBadge 
                                badge={badge.badge} 
                                size="lg"
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {featuredBadges.length === 0 && (
                        <div className="flex items-center justify-center w-full h-full">
                          <p className="text-sm text-muted-foreground text-center">
                            Drag your favorite badges here to feature them on your profile
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
                
                <Button 
                  onClick={saveFeaturedBadges} 
                  className="mt-4 w-full" 
                  disabled={loading}
                >
                  Save Featured Badges
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
} 