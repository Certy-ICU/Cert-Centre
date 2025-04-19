"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ChapterCompletion {
  chapterId: string;
  chapterTitle: string;
  courseTitle: string;
  completionCount: number;
}

interface ChapterCompletionListProps {
  data: ChapterCompletion[];
}

export const ChapterCompletionList = ({
  data
}: ChapterCompletionListProps) => {
  return (
    <Card>
      <div className="rounded-md border dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-slate-700">
              <TableHead className="dark:text-slate-300">Chapter</TableHead>
              <TableHead className="dark:text-slate-300">Course</TableHead>
              <TableHead className="text-right dark:text-slate-300">Completions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow className="dark:border-slate-700">
                <TableCell colSpan={3} className="text-center text-muted-foreground py-6 dark:text-slate-400">
                  No completion data found
                </TableCell>
              </TableRow>
            )}
            {data.map((chapter) => (
              <TableRow key={chapter.chapterId} className="dark:border-slate-700">
                <TableCell className="font-medium dark:text-slate-300">{chapter.chapterTitle}</TableCell>
                <TableCell className="text-muted-foreground dark:text-slate-400">{chapter.courseTitle}</TableCell>
                <TableCell className="text-right dark:text-slate-300">{chapter.completionCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}; 