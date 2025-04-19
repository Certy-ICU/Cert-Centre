"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

export const SyncUserButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      // Ask for admin secret
      const adminSecret = prompt("Enter admin secret to sync users:");
      if (!adminSecret) {
        setIsSyncing(false);
        return;
      }
      
      // Limit to 10 users by default to avoid rate limits
      const limit = prompt("Enter max number of users to sync (default: 10):", "10");
      const maxUsers = parseInt(limit || "10");
      
      const response = await axios.post("/api/admin/sync-users", {
        adminSecret,
        limit: maxUsers
      });
      
      setSyncCount(response.data.totalSynced);
      toast.success(`Synced ${response.data.totalSynced} users successfully!`);
      
      // Reload page to show updated usernames
      window.location.reload();
    } catch (error) {
      console.error("Error syncing users:", error);
      toast.error("Failed to sync users");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSync}
      disabled={isSyncing}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : syncCount ? `Synced ${syncCount} users` : "Sync User Data"}
    </Button>
  );
}; 