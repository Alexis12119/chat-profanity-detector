"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AdminOverview } from "./admin-overview";
import { UserManagement } from "./user-management";
import { ViolationManagement } from "./violation-management";
import { PunishmentManagement } from "./punishment-management";
import { SystemLogs } from "./system-logs";
import { RoomManagement } from "./room-management";
import {
  Users,
  Shield,
  AlertTriangle,
  Activity,
  MessageSquare,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
}

interface AdminDashboardProps {
  user: User;
  profile: Profile;
}

export function AdminDashboard({ user, profile }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/chat">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage users, violations, and system settings
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Logged in as{" "}
              <span className="font-medium">
                {profile.display_name || profile.username}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="violations" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Violations
            </TabsTrigger>
            <TabsTrigger
              value="punishments"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Punishments
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement adminId={user.id} />
          </TabsContent>

          <TabsContent value="violations">
            <ViolationManagement adminId={user.id} />
          </TabsContent>

          <TabsContent value="punishments">
            <PunishmentManagement adminId={user.id} />
          </TabsContent>

          <TabsContent value="rooms">
            <RoomManagement adminId={user.id} />
          </TabsContent>

          <TabsContent value="logs">
            <SystemLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
