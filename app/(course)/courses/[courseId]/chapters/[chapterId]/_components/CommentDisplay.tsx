"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Trash, Edit, Reply, User, Flag, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface CommentDisplayProps {
  comment: Comment;
  courseId: string;
  chapterId: string;
  currentUserId: string;
  onDelete: (commentId: string) => void;
  onRefresh: () => void;
  depth?: number;
}

export const CommentDisplay = ({
  comment,
  courseId,
  chapterId,
  currentUserId,
  onDelete,
  onRefresh,
  depth = 0,
}: CommentDisplayProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const handleEdit = async () => {
    if (!editText.trim()) return;

    try {
      setIsSubmitting(true);
      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}/comments/${comment.id}`,
        { text: editText }
      );
      setIsEditing(false);
      toast.success("Comment updated");
      onRefresh();
    } catch (error) {
      toast.error("Failed to update comment");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      setIsSubmitting(true);
      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/comments`,
        { text: replyText, parentId: comment.id }
      );
      setIsReplying(false);
      setReplyText("");
      toast.success("Reply added");
      onRefresh();
    } catch (error) {
      toast.error("Failed to add reply");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportComment = async () => {
    if (!reportReason.trim()) {
      toast.error("Please provide a reason for reporting");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        `/api/courses/${courseId}/chapters/${chapterId}/comments/${comment.id}/report`,
        { reason: reportReason }
      );
      setIsReportDialogOpen(false);
      setReportReason("");
      toast.success("Comment reported successfully");
      onRefresh();
    } catch (error) {
      const errorMessage = 
        axios.isAxiosError(error) && error.response?.status === 400
          ? error.response.data || "Failed to report comment"
          : "Failed to report comment";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = comment.userId === currentUserId;
  const maxDepth = 3; // Maximum nesting level for replies
  
  // Safely access user data
  const userName = comment.user?.name || `User ${comment.userId.substring(0, 4)}`;
  const userImage = comment.user?.imageUrl;
  
  // Check if comment is reported
  const isReported = comment.moderation?.isReported === true;

  return (
    <>
      <div 
        className={`
          border-l-2 pl-4 py-2
          ${depth > 0 ? "ml-4" : ""}
          ${depth === 0 ? "border-slate-300 dark:border-slate-600" : "border-slate-200 dark:border-slate-700"}
          ${isReported ? "bg-red-50 dark:bg-red-900/20" : ""}
        `}
      >
        <div className="flex items-start gap-2 mb-1">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
            {userImage ? (
              <div className="h-full w-full relative">
                <Image
                  src={userImage}
                  alt={userName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <span className="font-medium mr-2 dark:text-white">{userName}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {isReported && (
                  <span className="text-xs text-red-500 dark:text-red-400 ml-2 inline-flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Reported
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {isOwner ? (
                  <>
                    <Button 
                      onClick={() => setIsEditing(!isEditing)} 
                      variant="ghost" 
                      size="sm"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => onDelete(comment.id)} 
                      variant="ghost" 
                      size="sm"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  !isReported && (
                    <Button 
                      onClick={() => setIsReportDialogOpen(true)} 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  )
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="mt-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="mb-2 dark:bg-slate-800 dark:border-slate-700"
                  disabled={isSubmitting}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleEdit}
                    size="sm"
                    disabled={isSubmitting || !editText.trim()}
                  >
                    Save
                  </Button>
                  <Button 
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    size="sm"
                    className="dark:border-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <p className="text-sm dark:text-slate-300">{comment.text}</p>
              </div>
            )}

            {!isEditing && !isReplying && depth < maxDepth && (
              <Button 
                onClick={() => setIsReplying(true)} 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-xs dark:text-slate-300"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {isReplying && (
              <div className="mt-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="mb-2 dark:bg-slate-800 dark:border-slate-700"
                  disabled={isSubmitting}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleReply}
                    size="sm"
                    disabled={isSubmitting || !replyText.trim()}
                  >
                    Post Reply
                  </Button>
                  <Button 
                    onClick={() => setIsReplying(false)}
                    variant="outline"
                    size="sm"
                    className="dark:border-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map((reply) => (
                  <CommentDisplay
                    key={reply.id}
                    comment={reply}
                    courseId={courseId}
                    chapterId={chapterId}
                    currentUserId={currentUserId}
                    onDelete={onDelete}
                    onRefresh={onRefresh}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Report Comment</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Please provide a reason for reporting this comment. Reported comments will be reviewed by moderators.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Why are you reporting this comment?"
            className="mt-4 dark:bg-slate-700 dark:border-slate-600"
            disabled={isSubmitting}
          />
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsReportDialogOpen(false)}
              className="dark:border-slate-600 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReportComment}
              disabled={isSubmitting || !reportReason.trim()}
              className="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Report Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 