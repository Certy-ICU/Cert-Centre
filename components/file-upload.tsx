"use client";

import toast from "react-hot-toast";

import { UploadDropzone } from "@/lib/uploadthing";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { useMediaQuery } from "@/hooks/use-media-query";

interface FileUploadProps {
  onChange: (url?: string) => void;
  endpoint: keyof typeof ourFileRouter;
};

export const FileUpload = ({
  onChange,
  endpoint
}: FileUploadProps) => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  
  return (
    <div className="w-full max-w-[100%] overflow-hidden">
      <UploadDropzone
        className="ut-label:text-sm xs:ut-label:text-sm sm:ut-label:text-base 
                  ut-allowed-content:text-xs xs:ut-allowed-content:text-xs sm:ut-allowed-content:text-sm 
                  ut-button:text-xs xs:ut-button:text-xs sm:ut-button:text-sm 
                  ut-upload-icon:h-8 ut-upload-icon:w-8 xs:ut-upload-icon:h-10 xs:ut-upload-icon:w-10 sm:ut-upload-icon:h-14 sm:ut-upload-icon:w-14
                  ut-container:min-h-[auto] xs:ut-container:min-h-[auto] sm:ut-container:min-h-[220px]"
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          onChange(res?.[0].url);
          toast.success("Upload completed");
        }}
        onUploadError={(error: Error) => {
          toast.error(`${error?.message}`);
        }}
        content={{
          label: isMobile ? "Upload file" : "Upload your file here",
          allowedContent: isMobile ? "Images & videos" : "Images, videos, and other files up to 4MB",
          button: isMobile ? "Upload" : "Click to upload"
        }}
      />
    </div>
  )
}