'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface VerificationResult {
  valid: boolean;
  courseTitle?: string;
  issueDate?: Date;
  message?: string;
}

const VerifyCertificatePage = () => {
  const [certificateId, setCertificateId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId) {
      toast.error("Please enter a certificate ID");
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);
      
      console.log("Verifying certificate:", certificateId);
      const response = await axios.get(`/api/certificates/verify?id=${encodeURIComponent(certificateId)}`);
      console.log("Verification response:", response.data);
      
      if (response.data.valid) {
        setResult({
          valid: true,
          courseTitle: response.data.courseTitle,
          issueDate: new Date(response.data.issueDate)
        });
        toast.success("Certificate verified successfully");
      } else {
        setResult({
          valid: false,
          message: response.data.message || "Certificate verification failed"
        });
        toast.error("Failed to verify certificate");
      }
    } catch (error: any) {
      console.error("Certificate verification error:", error);
      
      setResult({
        valid: false,
        message: error.response?.data?.message || 
                 error.response?.data?.error || 
                 "Certificate verification failed. Please try again later."
      });
      
      toast.error("Verification error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Verify Certificate</h1>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 dark:shadow-slate-900/30">
        <p className="text-slate-700 dark:text-slate-300 mb-6">
          Enter the certificate ID to verify its authenticity.
        </p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="Enter certificate ID"
              className="md:w-2/3 dark:bg-slate-900 dark:border-slate-700"
            />
            <Button
              type="submit"
              disabled={isLoading || !certificateId}
              className="md:w-1/3"
            >
              {isLoading ? "Verifying..." : "Verify Certificate"}
            </Button>
          </div>
        </form>
        
        {result && (
          <div className={cn(
            "mt-8 p-4 rounded-md",
            result.valid 
              ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
              : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
          )}>
            <div className="flex items-center gap-x-2 mb-4">
              {result.valid ? (
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
              )}
              <h2 className="text-xl font-medium dark:text-white">
                {result.valid ? "Certificate is Valid" : "Certificate Verification Failed"}
              </h2>
            </div>
            
            {result.valid ? (
              <div className="space-y-2">
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Course:</span> {result.courseTitle}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Issue Date:</span> {result.issueDate?.toLocaleDateString()}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Certificate ID:</span> {certificateId}
                </p>
              </div>
            ) : (
              <p className="text-red-700 dark:text-red-400">{result.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificatePage; 