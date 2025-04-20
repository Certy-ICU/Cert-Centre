import React from 'react';

export const metadata = {
  title: 'API Documentation - Cert Centre LMS',
  description: 'Interactive API documentation for the Cert Centre Learning Management System',
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Cert Centre LMS API</h1>
          <p className="text-slate-300">Interactive API documentation</p>
        </div>
      </header>
      
      {children}
      
      <footer className="bg-slate-900 text-white p-4 mt-8">
        <div className="container mx-auto text-center text-sm">
          <p>© {new Date().getFullYear()} Cert Centre. API Documentation powered by Swagger/OpenAPI.</p>
          <div className="mt-2">
            <a 
              href="/docs/improvements/api-docs-quickstart.md" 
              className="text-blue-400 hover:underline mx-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              API Quickstart Guide
            </a>
            <a 
              href="/docs/improvements/api-docs-developer-guide.md" 
              className="text-blue-400 hover:underline mx-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Developer Guide
            </a>
            <a 
              href="https://swagger.io/specification/" 
              className="text-blue-400 hover:underline mx-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenAPI Spec
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
} 