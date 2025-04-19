import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { IconBadge } from "@/components/icon-badge";
import { formatPrice } from "@/lib/format";
import { CourseProgress } from "@/components/course-progress";
import { SocialShare } from "@/components/social-share";

interface CourseCardProps {
  id: string;
  title: string;
  imageUrl: string;
  chaptersLength: number;
  price: number;
  progress: number | null;
  category: string;
};

export const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  price,
  progress,
  category
}: CourseCardProps) => {
  // Create the URL for the course
  const courseUrl = `/courses/${id}`;
  
  return (
    <div className="group shadow-card border rounded-lg p-2 xs:p-2 sm:p-3 h-full flex flex-col">
      <Link href={courseUrl} className="flex-grow touch-target">
        <div className="relative w-full aspect-video rounded-md overflow-hidden">
          <Image
            fill
            className="object-cover"
            alt={title}
            src={imageUrl}
          />
        </div>
        <div className="flex flex-col pt-2">
          <div className="text-base xs:text-base sm:text-lg md:text-base font-medium group-hover:text-sky-700 transition truncate-text-2">
            {title}
          </div>
          <p className="text-xs text-muted-foreground truncate-text-1">
            {category}
          </p>
          <div className="my-2 xs:my-2 sm:my-3 flex items-center gap-x-2 text-xs xs:text-xs sm:text-sm">
            <div className="flex items-center gap-x-1 text-slate-500">
              <IconBadge size="xs" icon={BookOpen} />
              <span>
                {chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}
              </span>
            </div>
          </div>
          {progress !== null ? (
            <CourseProgress
              variant={progress === 100 ? "success" : "default"}
              size="sm"
              value={progress}
            />
          ) : (
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatPrice(price)}
            </p>
          )}
        </div>
      </Link>
      <div className="mt-3 pt-3 border-t">
        <SocialShare 
          url={courseUrl}
          title={`Check out this course: ${title}`}
          description={`A course about ${category} with ${chaptersLength} chapters`}
          iconSize={24}
          className="justify-center"
        />
      </div>
    </div>
  )
}