"use client";

import toast from "react-hot-toast";

import { UploadDropzone } from "@/lib/uploadthing";
import { ourFileRouter } from "@/app/api/uploadthing/core";

interface FileUploadProps {
  onChange: (url?: string) => void;
  endpoint: keyof typeof ourFileRouter;
};

export const FileUpload = ({
  onChange,
  endpoint
}: FileUploadProps) => {
  return (
    <div className="w-full max-w-[100%] overflow-hidden">
      <UploadDropzone
        className="ut-label:text-sm sm:ut-label:text-base ut-allowed-content:text-xs sm:ut-allowed-content:text-sm ut-button:text-xs sm:ut-button:text-sm ut-upload-icon:h-10 ut-upload-icon:w-10 sm:ut-upload-icon:h-14 sm:ut-upload-icon:w-14"
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          onChange(res?.[0].url);
        }}
        onUploadError={(error: Error) => {
          toast.error(`${error?.message}`);
        }}
      />
    </div>
  )
}