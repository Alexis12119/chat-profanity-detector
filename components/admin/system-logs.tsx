"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, User, MessageSquare, Shield, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityLog {
  id: string
  action: string
  details: any
  created_at: string
  profiles: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function SystemLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [filterAction, setFilterAction] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    let filtered = logs

    if (filterAction !== "all") {
      filtered = filtered.filter((log) => log.action === filterAction)
    }

    setFilteredLogs(filtered)
  }, [logs, filterAction])

  const loadLogs = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        *,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error loading logs:", error)
    } else {
      setLogs(data || [])
    }
    setIsLoading(false)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "login":
      case "logout":
        return <User className="h-4 w-4" />
      case "message_sent":
        return <MessageSquare className="h-4 w-4" />
      case "violation_detected":
        return <AlertTriangle className="h-4 w-4" />
      case "punishment_appeal":
        return <Shield className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "login":
        return "bg-green-100 text-green-800"
      case "logout":
        return "bg-gray-100 text-gray-800"
      case "message_sent":
        return "bg-blue-100 text-blue-800"
      case "violation_detected":
        return "bg-red-100 text-red-800"
      case "punishment_appeal":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDetails = (action: string, details: any) => {
    if (!details) return null

    switch (action) {
      case "message_sent":
        return `Room: ${details.room_name || "Unknown"} (${details.message_length || 0} chars)`
      case "violation_detected":
        return `Type: ${details.violation_type || "Unknown"} (Severity: ${details.severity || "N/A"})`
      case "punishment_appeal":
        return `${details.punishment_type || "Unknown"} appeal`
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Activity Logs
        </CardTitle>
        <CardDescription>Monitor user activities and system events</CardDescription>

        <div className="flex items-center gap-4">
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="message_sent">Message Sent</SelectItem>
              <SelectItem value="violation_detected">Violation Detected</SelectItem>
              <SelectItem value="punishment_appeal">Punishment Appeal</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">{filteredLogs.length} activities</div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading activity logs...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={log.profiles.avatar_url || undefined} />
                        <AvatarFallback>
                          {(log.profiles.display_name || log.profiles.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{log.profiles.display_name || log.profiles.username}</div>
                        <div className="text-sm text-muted-foreground">@{log.profiles.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`flex items-center gap-1 w-fit ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      <span className="capitalize">{log.action.replace("_", " ")}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDetails(log.action, log.details) || "No additional details"}</div>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
