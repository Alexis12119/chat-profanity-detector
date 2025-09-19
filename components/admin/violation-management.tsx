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
import { AlertTriangle, Eye, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Violation {
  id: string;
  violation_type: string;
  description: string;
  severity: number;
  detected_by: string;
  created_at: string;
  message_id: string | null;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  messages?: {
    content: string;
  } | null;
}

interface ViolationManagementProps {
  adminId: string;
}

export function ViolationManagement({ adminId }: ViolationManagementProps) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<Violation[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadViolations();
  }, []);

  useEffect(() => {
    let filtered = violations;

    if (filterType !== "all") {
      filtered = filtered.filter((v) => v.violation_type === filterType);
    }

    if (filterSeverity !== "all") {
      const severity = Number.parseInt(filterSeverity);
      filtered = filtered.filter((v) => v.severity === severity);
    }

    setFilteredViolations(filtered);
  }, [violations, filterType, filterSeverity]);

  const loadViolations = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("violations")
      .select(
        `
        *,
        profiles (
          username,
          display_name,
          avatar_url
        ),
        messages!fk_violations_message_id (
          content
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading violations:", error);
    } else {
      setViolations(data || []);
    }
    setIsLoading(false);
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-orange-100 text-orange-800";
      case 3:
        return "bg-red-100 text-red-800";
      case 4:
      case 5:
        return "bg-red-200 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      case 4:
        return "Critical";
      case 5:
        return "Severe";
      default:
        return "Unknown";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Violation Management
        </CardTitle>
        <CardDescription>
          Review and manage community guideline violations
        </CardDescription>

        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="profanity">Profanity</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="excessive_length">Excessive Length</SelectItem>
              <SelectItem value="repeated_messages">
                Repeated Messages
              </SelectItem>
              <SelectItem value="rapid_posting">Rapid Posting</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="1">Low (1)</SelectItem>
              <SelectItem value="2">Medium (2)</SelectItem>
              <SelectItem value="3">High (3)</SelectItem>
              <SelectItem value="4">Critical (4)</SelectItem>
              <SelectItem value="5">Severe (5)</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {filteredViolations.length} violations
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading violations...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Detected By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredViolations.map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={violation.profiles.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {(
                            violation.profiles.display_name ||
                            violation.profiles.username
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {violation.profiles.display_name ||
                            violation.profiles.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{violation.profiles.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {violation.violation_type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(violation.severity)}>
                      {getSeverityLabel(violation.severity)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={violation.description}>
                      {violation.description}
                    </div>
                    {violation.messages && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        Message: "{violation.messages.content}"
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(violation.created_at), {
                      addSuffix: true,
                    })}
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
