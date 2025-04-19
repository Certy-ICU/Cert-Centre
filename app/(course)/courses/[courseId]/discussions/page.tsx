import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";
import { DiscussionSection } from "../_components/DiscussionSection";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const CourseDiscussionsPage = async ({
  params
}: {
  params: { courseId: string };
}) => {
  const { userId } = auth();
  
  if (!userId) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    select: {
      id: true,
      title: true,
    }
  });

  if (!course) {
    return redirect("/");
  }

  return (
    <div className="h-full">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center">
          <Link
            href={`/courses/${params.courseId}`}
            className="flex items-center text-sm hover:opacity-75 transition mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to course
          </Link>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold">Discussions: {course.title}</h1>
          <p className="text-sm text-slate-600 mt-1">
            Join the conversation, ask questions, and engage with others taking this course.
          </p>
        </div>
        
        <Separator />

        <DiscussionSection courseId={params.courseId} />
      </div>
    </div>
  );
};
 
export default CourseDiscussionsPage; 