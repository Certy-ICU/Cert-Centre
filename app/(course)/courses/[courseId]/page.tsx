import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";
import { SuccessHandler } from "./components/success-handler";

const CourseIdPage = async ({
  params,
  searchParams,
}: {
  params: { courseId: string; };
  searchParams: { success?: string; canceled?: string; };
}) => {
  const { userId } = auth();
  
  if (!userId) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc"
        }
      }
    }
  });

  if (!course) {
    return redirect("/");
  }

  // If success parameter is present, show the success handler
  if (searchParams.success === "1") {
    return (
      <div className="h-full flex items-center justify-center">
        <SuccessHandler courseId={params.courseId} />
      </div>
    );
  }

  // Otherwise redirect to first chapter
  if (course.chapters.length > 0) {
    return redirect(`/courses/${course.id}/chapters/${course.chapters[0].id}`);
  } else {
    return <div>This course has no chapters yet.</div>;
  }
}
 
export default CourseIdPage;