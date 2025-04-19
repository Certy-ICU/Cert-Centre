'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CertificateDebugPage() {
  const { userId } = useAuth();
  const [certificateId, setCertificateId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [rawResult, setRawResult] = useState<any>(null);
  const [verificationMethod, setVerificationMethod] = useState<'regular' | 'debug' | 'fallback'>('regular');
  const [dbStatus, setDbStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  
  useEffect(() => {
    fetchDebugData();
  }, []);
  
  const fetchDebugData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/certificates/debug');
      setDebugData(response.data);
      setDbStatus(response.data.dbConnected ? 'connected' : 'error');
    } catch (error) {
      console.error("Error fetching debug data:", error);
      setDbStatus('error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyManually = async () => {
    if (!certificateId) return;
    
    try {
      setIsLoading(true);
      setRawResult(null);
      
      if (verificationMethod === 'regular') {
        try {
          const response = await axios.get(`/api/certificates/verify?id=${encodeURIComponent(certificateId)}`);
          setRawResult({
            source: "verify endpoint",
            ...response.data
          });
        } catch (error) {
          console.error("Verification API error:", error);
          setRawResult({
            source: "verify endpoint (error)",
            error: error.response?.data || String(error)
          });
        }
      } else if (verificationMethod === 'debug') {
        try {
          const debugResponse = await axios.get(`/api/certificates/debug?id=${encodeURIComponent(certificateId)}`);
          setRawResult({
            source: "debug endpoint",
            ...debugResponse.data
          });
        } catch (debugError) {
          console.error("Debug API error:", debugError);
          setRawResult({
            source: "debug endpoint (error)",
            error: debugError.response?.data || String(debugError)
          });
        }
      } else if (verificationMethod === 'fallback') {
        try {
          const fallbackResponse = await axios.get(`/api/certificates/fallback?id=${encodeURIComponent(certificateId)}`);
          setRawResult({
            source: "fallback endpoint",
            ...fallbackResponse.data
          });
        } catch (fallbackError) {
          console.error("Fallback API error:", fallbackError);
          setRawResult({
            source: "fallback endpoint (error)",
            error: fallbackError.response?.data || String(fallbackError)
          });
        }
      }
    } catch (error) {
      console.error("Error in verification:", error);
      setRawResult({
        source: "general error",
        error: String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Certificate Debugging</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Your Certificates</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : !debugData ? (
            <p>No data available. <Button onClick={fetchDebugData}>Retry</Button></p>
          ) : (
            <div>
              <div className="mb-4">
                <p className={`font-medium ${dbStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                  <strong>Database Connected:</strong> {debugData.dbConnected ? "Yes" : "No"}
                </p>
                <p><strong>Certificate Count:</strong> {debugData.certificateCount}</p>
                <p><strong>User ID:</strong> {debugData.userId}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Your Certificates:</h3>
                {debugData.certificates?.length > 0 ? (
                  <div className="space-y-2">
                    {debugData.certificates.map((cert: any) => (
                      <div key={cert.id} className="p-3 border rounded-md">
                        <p><strong>Certificate ID:</strong> {cert.certificateId}</p>
                        <p><strong>Course:</strong> {cert.courseTitle}</p>
                        <p><strong>Created:</strong> {new Date(cert.createdAt).toLocaleString()}</p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={() => {
                              setCertificateId(cert.certificateId);
                              setVerificationMethod('regular');
                              verifyManually();
                            }}
                          >
                            Verify Standard
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setCertificateId(cert.certificateId);
                              setVerificationMethod('fallback');
                              verifyManually();
                            }}
                          >
                            Verify Fallback
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No certificates found</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Manual Verification</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Certificate ID</label>
              <div className="flex gap-2">
                <Input
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="Enter certificate ID to verify"
                />
              </div>
            </div>
            
            <Tabs defaultValue="regular" onValueChange={(value) => setVerificationMethod(value as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="regular" className="flex-1">Regular API</TabsTrigger>
                <TabsTrigger value="debug" className="flex-1">Debug API</TabsTrigger>
                <TabsTrigger value="fallback" className="flex-1">Fallback API</TabsTrigger>
              </TabsList>
              <TabsContent value="regular" className="px-2 py-4">
                <p className="text-sm text-slate-600 mb-2">
                  Uses the main verification endpoint that other parts of the application use.
                </p>
                <Button 
                  onClick={() => {
                    setVerificationMethod('regular');
                    verifyManually();
                  }}
                  disabled={isLoading || !certificateId}
                  className="w-full"
                >
                  Verify with Regular API
                </Button>
              </TabsContent>
              <TabsContent value="debug" className="px-2 py-4">
                <p className="text-sm text-slate-600 mb-2">
                  Uses the debug endpoint that provides detailed information about certificates.
                </p>
                <Button 
                  onClick={() => {
                    setVerificationMethod('debug');
                    verifyManually();
                  }}
                  disabled={isLoading || !certificateId}
                  className="w-full"
                >
                  Verify with Debug API
                </Button>
              </TabsContent>
              <TabsContent value="fallback" className="px-2 py-4">
                <p className="text-sm text-slate-600 mb-2">
                  Uses a fallback API that works without database access. Good for testing when the database is down.
                </p>
                <Button 
                  onClick={() => {
                    setVerificationMethod('fallback');
                    verifyManually();
                  }}
                  disabled={isLoading || !certificateId}
                  className="w-full"
                >
                  Verify with Fallback API
                </Button>
              </TabsContent>
            </Tabs>
            
            {rawResult && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Raw Result:</h3>
                <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px]">
                  <pre className="text-xs">{JSON.stringify(rawResult, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 