"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { CommentDisplay } from "./CommentDisplay";
import { showPointsNotification } from "@/components/gamification/badge-notification";
import { pusherClient } from "@/lib/pusher-client";
import { TypingIndicator, useTypingHandler } from "./TypingIndicator";

interface UserData {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

interface Moderation {
  isReported: boolean;
  reportReason?: string;
  reportedAt?: string;
  reportedBy?: string;
}

interface Comment {
  id: string;
  text: string;
  userId: string;
  courseId: string;
  chapterId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  moderation?: Moderation;
  user?: UserData;
  replies: Comment[];
}

interface CommentSectionProps {
  courseId: string;
  chapterId: string;
}

export const CommentSection = ({
  courseId,
  chapterId,
}: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const handleTyping = useTypingHandler(chapterId, courseId);

  // Debug Pusher connection
  useEffect(() => {
    console.log('Pusher key:', process.env.NEXT_PUBLIC_PUSHER_KEY);
    console.log('Pusher cluster:', process.env.NEXT_PUBLIC_PUSHER_CLUSTER);
    
    // Add connection event listeners
    pusherClient.connection.bind('connected', () => {
      console.log('Connected to Pusher successfully!');
    });
    
    pusherClient.connection.bind('error', (err: Error) => {
      console.error('Pusher connection error:', err);
    });
    
    return () => {
      pusherClient.connection.unbind_all();
    };
  }, []);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/courses/${courseId}/chapters/${chapterId}/comments`
      );
      setComments(response.data);
    } catch (error) {
      toast.error("Failed to load comments");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Set up Pusher real-time subscription
    const channelName = `chapter-${chapterId}-comments`;
    console.log(`Subscribing to channel: ${channelName}`);
    const channel = pusherClient.subscribe(channelName);

    // Debug subscription
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to', channelName);
    });

    channel.bind('pusher:subscription_error', (error: Error) => {
      console.error('Failed to subscribe to', channelName, error);
    });

    // Handle new comments
    channel.bind('comment:new', (data: { comment: Comment }) => {
      console.log('Received comment:new event', data);
      setComments((prevComments) => [data.comment, ...prevComments]);
    });

    // Handle comment replies
    channel.bind('comment:reply', (data: { comment: Comment }) => {
      console.log('Received comment:reply event', data);
      setComments((prevComments) => {
        // Find parent comment and add reply
        return prevComments.map((comment) => {
          if (comment.id === data.comment.parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data.comment]
            };
          }
          return comment;
        });
      });
    });

    // Handle comment updates
    channel.bind('comment:update', (data: { comment: Comment }) => {
      console.log('Received comment:update event', data);
      setComments((prevComments) => {
        return prevComments.map((comment) => {
          // Check if this is the updated comment
          if (comment.id === data.comment.id) {
            return { ...comment, ...data.comment };
          }
          
          // Check if the updated comment is in replies
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map((reply) => 
                reply.id === data.comment.id ? { ...reply, ...data.comment } : reply
              )
            };
          }
          
          return comment;
        });
      });
    });

    // Handle comment deletions
    channel.bind('comment:delete', (data: { commentId: string }) => {
      console.log('Received comment:delete event', data);
      setComments((prevComments) => {
        // Filter out deleted comments
        const filteredComments = prevComments.filter(
          (comment) => comment.id !== data.commentId
        );
        
        // Also filter out deleted comments from replies
        return filteredComments.map((comment) => {
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.filter((reply) => reply.id !== data.commentId)
            };
          }
          return comment;
        });
      });
    });

    // Cleanup function
    return () => {
      console.log(`Unsubscribing from channel: ${channelName}`);
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [courseId, chapterId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/comments`,
        { text: commentText }
      );
      setCommentText("");
      toast.success("Comment added");
      
      // Show points notification for adding a comment
      showPointsNotification(5, "Posted a comment");
      
      // No need to manually fetch comments anymore as Pusher will update the UI
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
        `/api/courses/${courseId}/chapters/${chapterId}/comments/${commentId}`
      );
      toast.success("Comment deleted");
      // No need to manually fetch comments anymore as Pusher will update the UI
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error(error);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Discussion</h2>
      
      <TypingIndicator chapterId={chapterId} courseId={courseId} />
      
      {isSignedIn ? (
        <form onSubmit={onSubmit} className="mb-6">
          <Textarea
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              handleTyping(); // Trigger typing indicator
            }}
            placeholder="Add a comment..."
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
        <div className="text-center">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentDisplay
              key={comment.id}
              comment={comment}
              courseId={courseId}
              chapterId={chapterId}
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