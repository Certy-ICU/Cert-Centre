import { auth } from "@clerk/nextjs";
import { Chapter, Course, UserProgress } from "@prisma/client"
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { db } from "@/lib/db";
import { CourseProgress } from "@/components/course-progress";

import { CourseSidebarItem } from "./course-sidebar-item";

interface CourseSidebarProps {
  course: Course & {
    chapters: (Chapter & {
      userProgress: UserProgress[] | null;
    })[]
  };
  progressCount: number;
};

export const CourseSidebar = async ({
  course,
  progressCount,
}: CourseSidebarProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: course.id,
      }
    }
  });

  return (
    <div className="h-full border-r flex flex-col overflow-y-auto shadow-sm bg-white dark:bg-slate-900 dark:border-slate-700">
      <div className="p-8 flex flex-col border-b dark:border-slate-700">
        <h1 className="font-semibold dark:text-white">
          {course.title}
        </h1>
        {purchase && (
          <div className="mt-10">
            <CourseProgress
              variant="success"
              value={progressCount}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col w-full">
        {course.chapters.map((chapter) => (
          <CourseSidebarItem
            key={chapter.id}
            id={chapter.id}
            label={chapter.title}
            isCompleted={!!chapter.userProgress?.[0]?.isCompleted}
            courseId={course.id}
            isLocked={!chapter.isFree && !purchase}
          />
        ))}
        
        <Link
          href={`/courses/${course.id}/discussions`}
          className="p-4 flex items-center text-sm font-medium transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <MessageSquare className="h-5 w-5 mr-2 text-slate-500 dark:text-slate-400" />
          <span>Discussions</span>
        </Link>
      </div>
    </div>
  )
}