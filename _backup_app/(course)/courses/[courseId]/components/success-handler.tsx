"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";

export const SuccessHandler = ({ courseId }: { courseId: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const success = searchParams.get("success");
    
    if (success === "1" && !isProcessing) {
      setIsProcessing(true);
      
      // Allow time for webhook to process or create purchase
      setTimeout(async () => {
        try {
          // Try to verify/create purchase
          await axios.post(`/api/courses/${courseId}/confirm-purchase`);
          
          // Refresh and redirect back to course page (which will handle the chapter redirect)
          router.refresh();
          
          // Use replaceUrl to avoid adding it to the history stack
          window.location.href = `/courses/${courseId}`;
        } catch (error) {
          console.error("Error confirming purchase:", error);
          // Retry after delay
          setTimeout(() => {
            router.refresh();
            window.location.href = `/courses/${courseId}`;
          }, 2000);
        }
      }, 3000);
    }
  }, [courseId, router, searchParams, isProcessing]);

  if (searchParams.get("success") === "1") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p>Processing your payment...</p>
        </div>
      </div>
    );
  }
  
  return null;
} 