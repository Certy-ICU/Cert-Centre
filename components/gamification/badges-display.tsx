import { UserBadge } from "@/components/gamification/user-badge";

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  badge: Badge;
}

interface BadgesDisplayProps {
  earnedBadges: UserBadge[];
  size?: "sm" | "md" | "lg";
  emptyState?: React.ReactNode;
}

export const BadgesDisplay = ({
  earnedBadges,
  size = "md",
  emptyState
}: BadgesDisplayProps) => {
  if (earnedBadges.length === 0 && emptyState) {
    return (
      <div className="flex items-center justify-center p-4">
        {emptyState}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 justify-start">
      {earnedBadges.map((userBadge) => (
        <UserBadge
          key={userBadge.id}
          badge={userBadge.badge}
          size={size}
        />
      ))}
    </div>
  );
}; 