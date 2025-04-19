"use client";

import { Chapter } from "@prisma/client";
import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Grip, Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ChaptersListProps {
  items: Chapter[];
  onReorder: (updateData: { id: string; position: number }[]) => void;
  onEdit: (id: string) => void;
};

export const ChaptersList = ({
  items,
  onReorder,
  onEdit
}: ChaptersListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const queryClient = useQueryClient();
  
  // Store chapters data in React Query cache
  const { data: chapters = items } = useQuery({
    queryKey: ['chapters', items.map(item => item.id).join(',')],
    queryFn: () => items,
    initialData: items,
    enabled: isMounted
  });
  
  // Mutation for reordering chapters
  const { mutate: reorderChapters } = useMutation({
    mutationFn: (updatedChapters: Chapter[]) => {
      // Return a promise that resolves immediately since we're just updating local state
      return Promise.resolve(updatedChapters);
    },
    onSuccess: (updatedChapters) => {
      // Update the cache with the new order
      queryClient.setQueryData(['chapters', items.map(item => item.id).join(',')], updatedChapters);
      
      // Calculate bulk update data for the server
      const startIndex = 0;
      const endIndex = updatedChapters.length - 1;
      const chaptersToUpdate = updatedChapters.slice(startIndex, endIndex + 1);
      
      const bulkUpdateData = chaptersToUpdate.map((chapter) => ({
        id: chapter.id,
        position: updatedChapters.findIndex((item) => item.id === chapter.id)
      }));
      
      // Call the parent's onReorder function to update on the server
      onReorder(bulkUpdateData);
    }
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Update the cache when items prop changes
      queryClient.setQueryData(['chapters', items.map(item => item.id).join(',')], items);
    }
  }, [items, isMounted, queryClient]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderChapters(items);
  }

  if (!isMounted) {
    return null;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="chapters">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {chapters.map((chapter, index) => (
              <Draggable 
                key={chapter.id} 
                draggableId={chapter.id} 
                index={index}
              >
                {(provided) => (
                  <div
                    className={cn(
                      "flex items-center gap-x-2 bg-slate-200 border-slate-200 border text-slate-700 rounded-md mb-4 text-sm",
                      chapter.isPublished && "bg-sky-100 border-sky-200 text-sky-700"
                    )}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                  >
                    <div
                      className={cn(
                        "px-2 py-3 border-r border-r-slate-200 hover:bg-slate-300 rounded-l-md transition",
                        chapter.isPublished && "border-r-sky-200 hover:bg-sky-200"
                      )}
                      {...provided.dragHandleProps}
                    >
                      <Grip
                        className="h-5 w-5"
                      />
                    </div>
                    {chapter.title}
                    <div className="ml-auto pr-2 flex items-center gap-x-2">
                      {chapter.isFree && (
                        <Badge>
                          Free
                        </Badge>
                      )}
                      <Badge
                        className={cn(
                          "bg-slate-500",
                          chapter.isPublished && "bg-sky-700"
                        )}
                      >
                        {chapter.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <Pencil
                        onClick={() => onEdit(chapter.id)}
                        className="w-4 h-4 cursor-pointer hover:opacity-75 transition"
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}