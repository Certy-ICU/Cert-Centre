import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";
import { SuccessHandler } from "./components/success-handler";
import { checkCourseCompletion } from "@/actions/check-course-completion";
import { CertificateButton } from "@/components/certificate-button";

const CourseCompletionSection = async ({ courseId, userId }: { courseId: string, userId: string }) => {
  const isCompleted = await checkCourseCompletion(userId, courseId);
  
  if (!isCompleted) return null;
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-bold mb-4 text-center">Congratulations!</h3>
      <p className="text-center mb-6">
        You have completed this course. You can now download your certificate.
      </p>
      <div className="flex justify-center">
        <CertificateButton courseId={courseId} isCompleted={true} />
      </div>
    </div>
  );
};

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
      <div className="h-full flex flex-col items-center justify-center gap-y-6">
        <SuccessHandler courseId={params.courseId} />
        <CourseCompletionSection courseId={params.courseId} userId={userId} />
      </div>
    );
  }

  // Check if the user has completed the course for the certificate section
  if (course.chapters.length > 0) {
    // Redirect to first chapter but include the completion check
    return redirect(`/courses/${course.id}/chapters/${course.chapters[0].id}`);
  } else {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-y-6">
        <div>This course has no chapters yet.</div>
        <CourseCompletionSection courseId={params.courseId} userId={userId} />
      </div>
    );
  }
}
 
export default CourseIdPage;