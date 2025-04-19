"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import { Progress } from "@/components/ui/progress";

interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalRevenue: number;
  totalEnrollments: number;
  averageCompletion: number;
}

interface CourseAnalyticsTableProps {
  data: CourseAnalytics[];
}

export const CourseAnalyticsTable = ({
  data
}: CourseAnalyticsTableProps) => {
  return (
    <Card>
      <div className="rounded-md border dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-slate-700">
              <TableHead className="dark:text-slate-300">Course Title</TableHead>
              <TableHead className="text-right dark:text-slate-300">Revenue</TableHead>
              <TableHead className="text-right dark:text-slate-300">Enrollments</TableHead>
              <TableHead className="w-[300px] dark:text-slate-300">Completion Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow className="dark:border-slate-700">
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6 dark:text-slate-400">
                  No course data found
                </TableCell>
              </TableRow>
            )}
            {data.map((course) => (
              <TableRow key={course.courseId} className="dark:border-slate-700">
                <TableCell className="font-medium dark:text-slate-300">{course.courseTitle}</TableCell>
                <TableCell className="text-right dark:text-slate-300">{formatPrice(course.totalRevenue)}</TableCell>
                <TableCell className="text-right dark:text-slate-300">{course.totalEnrollments}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress 
                      className="h-2" 
                      value={course.averageCompletion} 
                    />
                    <span className="text-xs text-muted-foreground dark:text-slate-400">
                      {course.averageCompletion.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}; 