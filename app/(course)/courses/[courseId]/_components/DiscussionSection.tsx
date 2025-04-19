"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { DiscussionComment } from "./DiscussionComment";

interface UserData {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

interface Comment {
  id: string;
  text: string;
  userId: string;
  courseId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserData;
  replies: Comment[];
}

interface DiscussionSectionProps {
  courseId: string;
}

export const DiscussionSection = ({
  courseId,
}: DiscussionSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/courses/${courseId}/discussions`
      );
      setComments(response.data);
    } catch (error) {
      toast.error("Failed to load discussions");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [courseId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      await axios.post(
        `/api/courses/${courseId}/discussions`,
        { text: commentText }
      );
      setCommentText("");
      toast.success("Comment added");
      fetchComments();
    } catch (error) {
      toast.error("Failed to add comment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await axios.delete(
        `/api/courses/${courseId}/discussions/${commentId}`
      );
      toast.success("Comment deleted");
      fetchComments();
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error(error);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Course Discussions</h2>
      
      {isSignedIn ? (
        <form onSubmit={onSubmit} className="mb-6">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Start a discussion or ask a question..."
            className="mb-2"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      ) : (
        <div className="bg-slate-100 p-4 rounded-md mb-6">
          <p>Please sign in to join the discussion.</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center">Loading discussions...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No discussions yet. Be the first to start a conversation!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <DiscussionComment
              key={comment.id}
              comment={comment}
              courseId={courseId}
              currentUserId={user?.id || ""}
              onDelete={handleDeleteComment}
              onRefresh={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 