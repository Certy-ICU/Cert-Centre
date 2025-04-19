'use client';

import { Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import axios from "axios";
import { Course } from "@prisma/client";
import { CertificateButton } from "@/components/certificate-button";
import { cn } from "@/lib/utils";

interface CompletedCourse {
  id: string;
  title: string;
}

export const CertificatesList = () => {
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedCourses = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/user/completed-courses');
        setCompletedCourses(response.data);
      } catch (error) {
        console.error("Failed to fetch completed courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedCourses();
  }, []);

  if (isLoading) {
    return <div className="text-center p-6">Loading your certificates...</div>;
  }

  if (completedCourses.length === 0) {
    return (
      <div className="text-center p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
        <Award className="h-10 w-10 mx-auto text-slate-500 dark:text-slate-400 mb-2" />
        <h3 className="text-lg font-medium mb-1">No Certificates Yet</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Complete a course to earn your certificate.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Certificates</h2>
      <div className="space-y-4">
        {completedCourses.map((course) => (
          <div 
            key={course.id} 
            className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
          >
            <div className="mb-2 md:mb-0">
              <h3 className="font-medium dark:text-white">{course.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Course completed</p>
            </div>
            <CertificateButton courseId={course.id} isCompleted={true} />
          </div>
        ))}
      </div>
    </div>
  );
}; 