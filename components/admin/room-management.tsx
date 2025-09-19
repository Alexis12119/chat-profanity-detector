"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MessageSquare, Plus, Edit, Trash2, Lock, Hash } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface ChatRoom {
  id: string
  name: string
  description: string | null
  is_private: boolean
  created_at: string
}

interface RoomManagementProps {
  adminId: string
}

export function RoomManagement({ adminId }: RoomManagementProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    is_private: false,
  })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("chat_rooms").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading rooms:", error)
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      })
    } else {
      setRooms(data || [])
    }
    setIsLoading(false)
  }

  const createRoom = async () => {
    if (!newRoom.name.trim()) {
      toast({
        title: "Error",
        description: "Room name is required",
        variant: "destructive",
      })
      return
    }

    const { error } = await supabase.from("chat_rooms").insert({
      name: newRoom.name.trim(),
      description: newRoom.description.trim() || null,
      is_private: newRoom.is_private,
    })

    if (error) {
      console.error("Error creating room:", error)
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Room created successfully",
      })
      setIsCreateDialogOpen(false)
      setNewRoom({ name: "", description: "", is_private: false })
      loadRooms()
    }
  }

  const deleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to delete the room "${roomName}"? This action cannot be undone.`)) {
      return
    }

    const { error } = await supabase.from("chat_rooms").delete().eq("id", roomId)

    if (error) {
      console.error("Error deleting room:", error)
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Room deleted successfully",
      })
      loadRooms()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Room Management
        </CardTitle>
        <CardDescription>Create and manage chat rooms</CardDescription>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{rooms.length} total rooms</div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogDescription>Create a new chat room for users to communicate in.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    placeholder="Enter room name"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="roomDescription">Description (Optional)</Label>
                  <Textarea
                    id="roomDescription"
                    placeholder="Enter room description"
                    value={newRoom.description}
                    onChange={(e) => setNewRoom((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPrivate"
                    checked={newRoom.is_private}
                    onCheckedChange={(checked) => setNewRoom((prev) => ({ ...prev, is_private: checked }))}
                  />
                  <Label htmlFor="isPrivate">Private Room</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createRoom}>Create Room</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading rooms...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {room.is_private ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{room.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.is_private ? "secondary" : "outline"}>
                      {room.is_private ? "Private" : "Public"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={room.description || undefined}>
                      {room.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(room.created_at), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRoom(room.id, room.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
