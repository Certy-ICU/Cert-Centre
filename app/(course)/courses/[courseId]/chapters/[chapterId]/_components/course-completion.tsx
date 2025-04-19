'use client';

import { CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { CertificateButton } from "@/components/certificate-button";
import { checkCourseCompletion } from "@/actions/check-course-completion";

interface CourseCompletionProps {
  courseId: string;
  userId: string;
  chapterId: string;
  nextChapterId?: string;
  isCompleted: boolean;
}

export const CourseCompletion = ({
  courseId,
  userId,
  chapterId,
  nextChapterId,
  isCompleted
}: CourseCompletionProps) => {
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkCompletion = async () => {
      try {
        setIsChecking(true);
        // Check for course completion if the current chapter is completed
        // We'll check regardless of nextChapterId to ensure it shows in expected places
        if (isCompleted) {
          const isComplete = await checkCourseCompletion(userId, courseId);
          setIsCourseCompleted(isComplete);
        }
      } catch (error) {
        console.error("Failed to check course completion:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkCompletion();
  }, [courseId, userId, isCompleted]);

  // Don't render anything if the current chapter isn't completed
  if (!isCompleted) {
    return null;
  }

  // Always show completion component if the chapter is completed
  return (
    <div className="mt-4 p-4 border rounded-md bg-slate-100">
      <div className="flex items-center gap-x-2 mb-2">
        <CheckCircle className="text-green-600" />
        <h2 className="text-lg font-medium">
          Course Completion
        </h2>
      </div>
      <p className="text-sm text-slate-700 mb-4">
        {isCourseCompleted 
          ? "Congratulations! You've completed the course. Download your certificate below."
          : nextChapterId 
            ? "You've completed this chapter. Continue to the next chapter to progress in the course."
            : "You've completed this chapter, but there are other chapters you need to complete to finish the course."
        }
      </p>
      {isCourseCompleted && (
        <CertificateButton
          courseId={courseId}
          isCompleted={isCourseCompleted}
        />
      )}
    </div>
  );
}; 