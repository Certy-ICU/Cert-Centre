import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { File } from "lucide-react";

import { getChapter } from "@/actions/get-chapter";
import { Banner } from "@/components/banner";
import { Separator } from "@/components/ui/separator";
import { Preview } from "@/components/preview";
import { SocialShare } from "@/components/social-share";
import { PusherConnectionStatus } from "@/components/PusherConnectionStatus";
import { RealtimeEventIndicator } from "@/components/RealtimeEventIndicator";
import { ActiveViewersNotification } from "@/components/ActiveViewersNotification";
import { ActiveViewersCounter } from "@/components/ActiveViewersCounter";
import { LiveCollaborationBanner } from "@/components/LiveCollaborationBanner2";

import { VideoPlayer } from "./_components/video-player";
import { CourseEnrollButton } from "./_components/course-enroll-button";
import { CourseProgressButton } from "./_components/course-progress-button";
import { CourseCompletion } from "./_components/course-completion";
import { CommentSection } from "./_components/CommentSection";

const ChapterIdPage = async ({
  params
}: {
  params: { courseId: string; chapterId: string }
}) => {
  const { userId } = auth();
  
  if (!userId) {
    return redirect("/");
  } 

  const {
    chapter,
    course,
    muxData,
    attachments,
    nextChapter,
    userProgress,
    purchase,
  } = await getChapter({
    userId,
    chapterId: params.chapterId,
    courseId: params.courseId,
  });

  if (!chapter || !course) {
    return redirect("/")
  }


  const isLocked = !chapter.isFree && !purchase;
  const completeOnEnd = !!purchase && !userProgress?.isCompleted;

  // Create the full chapter URL for sharing
  const chapterUrl = `/courses/${params.courseId}/chapters/${params.chapterId}`;

  return ( 
    <div>
      {userProgress?.isCompleted && (
        <Banner
          variant="success"
          label="You already completed this chapter."
        />
      )}
      {isLocked && (
        <Banner
          variant="warning"
          label="You need to purchase this course to watch this chapter."
        />
      )}
      <div className="flex flex-col max-w-4xl mx-auto pb-20">
        <div className="p-4">
          <VideoPlayer
            chapterId={params.chapterId}
            title={chapter.title}
            courseId={params.courseId}
            nextChapterId={nextChapter?.id}
            playbackId={muxData?.playbackId!}
            isLocked={isLocked}
            completeOnEnd={completeOnEnd}
          />
        </div>
        <div>
          <LiveCollaborationBanner chapterId={params.chapterId} className="mx-4" />
          <div className="p-4 flex flex-col gap-2">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold mb-2 md:mb-0">
                  {chapter.title}
                </h2>
                <ActiveViewersCounter chapterId={params.chapterId} className="mb-2 md:mb-0" />
              </div>
              {purchase ? (
                <CourseProgressButton
                  chapterId={params.chapterId}
                  courseId={params.courseId}
                  nextChapterId={nextChapter?.id}
                  isCompleted={!!userProgress?.isCompleted}
                />
              ) : (
                <CourseEnrollButton
                  courseId={params.courseId}
                  price={course.price!}
                />
              )}
            </div>
            <div className="mt-1">
              <SocialShare 
                url={chapterUrl}
                title={`${course.title} - ${chapter.title}`}
                description={`Check out this chapter from ${course.title}`}
                iconSize={24}
              />
            </div>
          </div>
          <Separator />
          <div>
            <Preview value={chapter.description!} />
          </div>
          {!!attachments.length && (
            <>
              <Separator />
              <div className="p-4">
                {attachments.map((attachment) => (
                  <a 
                    href={attachment.url}
                    target="_blank"
                    key={attachment.id}
                    className="flex items-center p-3 w-full bg-sky-200 border text-sky-700 rounded-md hover:underline"
                  >
                    <File />
                    <p className="line-clamp-1">
                      {attachment.name}
                    </p>
                  </a>
                ))}
              </div>
            </>
          )}
          {purchase && (
            <div className="p-4">
              <CourseCompletion
                courseId={params.courseId}
                userId={userId}
                chapterId={params.chapterId}
                nextChapterId={nextChapter?.id}
                isCompleted={!!userProgress?.isCompleted}
              />
            </div>
          )}
          <Separator />
          <div className="p-4">
            <CommentSection
              courseId={params.courseId}
              chapterId={params.chapterId}
            />
          </div>
        </div>
      </div>
      <PusherConnectionStatus />
      <RealtimeEventIndicator />
      <ActiveViewersNotification chapterId={params.chapterId} />
    </div>
   );
}
 
export default ChapterIdPage;