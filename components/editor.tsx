"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import "react-quill/dist/quill.snow.css";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
};

export const Editor = ({
  onChange,
  value,
}: EditorProps) => {
  const ReactQuill = useMemo(() => dynamic(() => import("react-quill"), { ssr: false }), []);

  return (
    <div className="bg-white dark:bg-slate-700 dark:border dark:border-slate-600">
      <div className="dark:quill-dark">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          className="dark:text-white" 
          modules={{
            toolbar: [
              [{ header: [1, 2, 3, 4, 5, 6, false] }],
              ["bold", "italic", "underline", "strike", "blockquote"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "image"],
              ["clean"],
            ],
          }}
        />
      </div>
      <style jsx global>{`
        .dark .ql-toolbar {
          background-color: rgb(71, 85, 105) !important;
          border-color: rgb(71, 85, 105) !important;
          border-bottom-color: rgb(100, 116, 139) !important;
        }
        
        .dark .ql-toolbar .ql-stroke {
          stroke: white !important;
        }
        
        .dark .ql-toolbar .ql-fill {
          fill: white !important;
        }
        
        .dark .ql-toolbar .ql-picker {
          color: white !important;
        }

        .dark .ql-toolbar .ql-picker-options {
          background-color: rgb(51, 65, 85) !important;
          border-color: rgb(71, 85, 105) !important;
        }

        .dark .ql-editor {
          background-color: rgb(51, 65, 85) !important;
        }

        .dark .ql-container {
          border-color: rgb(71, 85, 105) !important;
        }
      `}</style>
    </div>
  );
};
