'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface CertificateButtonProps {
  courseId: string;
  isCompleted: boolean;
}

export const CertificateButton = ({ courseId, isCompleted }: CertificateButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onDownload = async () => {
    try {
      setIsLoading(true);
      
      // Open the PDF URL in a new tab
      window.open(`/api/courses/${courseId}/certificate`, '_blank');
      
      toast.success("Certificate generated successfully");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCompleted) {
    return (
      <Button 
        disabled 
        size="sm" 
        variant="outline"
        className="w-full md:w-auto"
      >
        Complete course for certificate
      </Button>
    );
  }

  return (
    <Button 
      onClick={onDownload} 
      size="sm" 
      disabled={isLoading}
      className="w-full md:w-auto bg-green-600 hover:bg-green-700"
    >
      <Download className="h-4 w-4 mr-2" />
      Download Certificate
    </Button>
  );
}; 