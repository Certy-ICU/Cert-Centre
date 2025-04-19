"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Trash, Edit, Reply, User } from "lucide-react";

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
  user?: UserData;
  replies: Comment[];
}

interface DiscussionCommentProps {
  comment: Comment;
  courseId: string;
  currentUserId: string;
  onDelete: (commentId: string) => void;
  onRefresh: () => void;
  depth?: number;
}

export const DiscussionComment = ({
  comment,
  courseId,
  currentUserId,
  onDelete,
  onRefresh,
  depth = 0,
}: DiscussionCommentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = async () => {
    if (!editText.trim()) return;

    try {
      setIsSubmitting(true);
      await axios.patch(
        `/api/courses/${courseId}/discussions/${comment.id}`,
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
        `/api/courses/${courseId}/discussions`,
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

  const isOwner = comment.userId === currentUserId;
  const maxDepth = 3; // Maximum nesting level for replies
  
  const userName = comment.user?.name || `User ${comment.userId.substring(0, 4)}`;
  const userImage = comment.user?.imageUrl;

  return (
    <div 
      className={`
        border-l-2 pl-4 py-2
        ${depth > 0 ? "ml-4" : ""}
        ${depth === 0 ? "border-slate-300" : "border-slate-200"}
      `}
    >
      <div className="flex items-start gap-2 mb-1">
        <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
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
              <User className="h-4 w-4 text-slate-500" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <span className="font-medium mr-2">{userName}</span>
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            {isOwner && (
              <div className="flex space-x-2">
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
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="mb-2"
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
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1">{comment.text}</p>
          )}

          {!isEditing && (
            <Button 
              onClick={() => setIsReplying(!isReplying)} 
              variant="ghost" 
              size="sm"
              className="mt-1"
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
                className="mb-2"
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
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <DiscussionComment
              key={reply.id}
              comment={reply}
              courseId={courseId}
              currentUserId={currentUserId}
              onDelete={onDelete}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 