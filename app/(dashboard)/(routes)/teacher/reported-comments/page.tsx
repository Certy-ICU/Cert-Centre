import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Type for the moderation field
interface Moderation {
  isReported: boolean;
  reportReason?: string;
  reportedAt?: string;
  reportedBy?: string;
}

const ReportedCommentsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  // Get all reported comments
  const reportedComments = await db.comment.findMany({
    where: {
      moderation: {
        not: undefined
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        }
      },
      course: {
        select: {
          id: true,
          title: true,
          userId: true,
        }
      },
      chapter: {
        select: {
          id: true,
          title: true,
        }
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Filter to show only reported comments from courses owned by this teacher
  const teacherReportedComments = reportedComments.filter(comment => {
    // Cast to unknown first, then to the expected type
    const moderation = (comment.moderation as unknown) as Moderation | null;
    return comment.course.userId === userId && moderation?.isReported === true;
  });

  const handleClearReport = async (commentId: string) => {
    "use server";
    
    // First check if the comment exists
    const comment = await db.comment.findUnique({
      where: { id: commentId }
    });
    
    // Only attempt to update if comment exists
    if (comment) {
      await db.comment.update({
        where: { id: commentId },
        data: { 
          moderation: Prisma.JsonNull
        }
      });
    }
    
    // Revalidate the page to refresh the data
    revalidatePath("/teacher/reported-comments");
  };

  const handleDeleteComment = async (commentId: string) => {
    "use server";
    
    // First check if the comment exists
    const comment = await db.comment.findUnique({
      where: { id: commentId }
    });
    
    // Only attempt to delete if comment exists
    if (comment) {
      await db.comment.delete({
        where: { id: commentId }
      });
    }
    
    // Revalidate the page to refresh the data
    revalidatePath("/teacher/reported-comments");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Reported Comments</h1>
      
      {teacherReportedComments.length === 0 ? (
        <p className="text-sm text-muted-foreground dark:text-slate-400">No reported comments found.</p>
      ) : (
        <div className="space-y-6">
          {teacherReportedComments.map((comment) => {
            // Cast to unknown first, then to the expected type
            const moderation = (comment.moderation as unknown) as Moderation;
            
            return (
              <Card key={comment.id} className="p-4 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="font-medium dark:text-white">
                      Comment by {comment.user?.name || "Unknown user"}
                    </h3>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">
                      In course: {comment.course.title}, chapter: {comment.chapter?.title || "Unknown chapter"}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">
                      Reported {moderation.reportedAt
                        ? formatDistanceToNow(new Date(moderation.reportedAt), { addSuffix: true }) 
                        : "recently"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={async () => {
                      "use server";
                      await handleClearReport(comment.id);
                    }}>
                      <Button type="submit" variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-200">
                        Dismiss Report
                      </Button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await handleDeleteComment(comment.id);
                    }}>
                      <Button type="submit" variant="destructive" size="sm">
                        Delete Comment
                      </Button>
                    </form>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
                  <p className="text-sm dark:text-slate-200">{comment.text}</p>
                </div>
                
                {moderation.reportReason && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-red-500 dark:text-red-400">Report Reason:</h4>
                    <p className="text-sm mt-1 p-2 bg-red-50 dark:bg-red-900/30 dark:text-slate-200 rounded-md">{moderation.reportReason}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportedCommentsPage; 