"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Punishment {
  id: string;
  punishment_type: string;
  duration_minutes: number | null;
  reason: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  punished: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface PunishmentManagementProps {
  adminId: string;
}

export function PunishmentManagement({ adminId }: PunishmentManagementProps) {
  const [punishments, setPunishments] = useState<Punishment[]>([]);
  const [filteredPunishments, setFilteredPunishments] = useState<Punishment[]>(
    [],
  );
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadPunishments();
  }, []);

  useEffect(() => {
    let filtered = punishments;

    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.punishment_type === filterType);
    }

    if (filterStatus === "active") {
      filtered = filtered.filter(
        (p) =>
          p.is_active && (!p.expires_at || new Date(p.expires_at) > new Date()),
      );
    } else if (filterStatus === "expired") {
      filtered = filtered.filter(
        (p) =>
          !p.is_active ||
          (p.expires_at && new Date(p.expires_at) <= new Date()),
      );
    }

    setFilteredPunishments(filtered);
  }, [punishments, filterType, filterStatus]);

  const loadPunishments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("punishments")
      .select(
        `
    *,
    punished:profiles!fk_punishments_user_id (
      username,
      display_name,
      avatar_url
    )
  `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading punishments:", error);
    } else {
      setPunishments(data || []);
    }
    setIsLoading(false);
  };

  const revokePunishment = async (
    punishmentId: string,
    userId: string,
    punishmentType: string,
  ) => {
    const { error } = await supabase
      .from("punishments")
      .update({ is_active: false })
      .eq("id", punishmentId);

    if (error) {
      console.error("Error revoking punishment:", error);
      toast({
        title: "Error",
        description: "Failed to revoke punishment",
        variant: "destructive",
      });
      return;
    }

    // If it's a ban, unban the user
    if (punishmentType === "ban") {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_banned: false })
        .eq("id", userId);

      if (profileError) {
        console.error("Error unbanning user:", profileError);
      }
    }

    toast({
      title: "Success",
      description: "Punishment revoked successfully",
    });
    loadPunishments();
  };

  const getPunishmentIcon = (type: string) => {
    switch (type) {
      case "ban":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "mute":
        return <Shield className="h-4 w-4 text-orange-500" />;
      case "warning":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getPunishmentVariant = (type: string) => {
    switch (type) {
      case "ban":
        return "destructive" as const;
      case "mute":
        return "secondary" as const;
      case "warning":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  const isExpired = (punishment: Punishment) => {
    return (
      !punishment.is_active ||
      (punishment.expires_at && new Date(punishment.expires_at) <= new Date())
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Punishment Management
        </CardTitle>
        <CardDescription>Review and manage user punishments</CardDescription>

        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ban">Bans</SelectItem>
              <SelectItem value="mute">Mutes</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {filteredPunishments.length} punishments
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading punishments...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPunishments.map((punishment) => (
                <TableRow key={punishment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={punishment.punished?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {(
                            punishment.punished?.display_name ||
                            punishment.punished?.username
                          )
                            ?.charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {punishment.punished?.display_name ||
                            punishment.punished?.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{punishment.punished?.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getPunishmentVariant(punishment.punishment_type)}
                      className="flex items-center gap-1 w-fit"
                    >
                      {getPunishmentIcon(punishment.punishment_type)}
                      <span className="capitalize">
                        {punishment.punishment_type}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={punishment.reason}>
                      {punishment.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    {punishment.duration_minutes ? (
                      <div>
                        {punishment.duration_minutes < 60
                          ? `${punishment.duration_minutes}m`
                          : punishment.duration_minutes < 1440
                            ? `${Math.floor(punishment.duration_minutes / 60)}h`
                            : `${Math.floor(punishment.duration_minutes / 1440)}d`}
                        {punishment.expires_at && (
                          <div className="text-xs text-muted-foreground">
                            Until{" "}
                            {format(
                              new Date(punishment.expires_at),
                              "MMM d, HH:mm",
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      "Permanent"
                    )}
                  </TableCell>
                  <TableCell>
                    {isExpired(punishment) ? (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 w-fit"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Expired
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        className="flex items-center gap-1 w-fit"
                      >
                        <Clock className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(punishment.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    {!isExpired(punishment) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          revokePunishment(
                            punishment.id,
                            punishment.punished.username,
                            punishment.punishment_type,
                          )
                        }
                      >
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
