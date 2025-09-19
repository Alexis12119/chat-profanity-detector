"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PunishmentAppealProps {
  punishmentId: string
  punishmentType: string
}

export function PunishmentAppeal({ punishmentId, punishmentType }: PunishmentAppealProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [appealText, setAppealText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmitAppeal = async () => {
    if (!appealText.trim()) {
      toast({
        title: "Appeal Required",
        description: "Please provide a reason for your appeal.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Log the appeal as an activity
      const { error } = await supabase.from("activity_logs").insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: "punishment_appeal",
        details: {
          punishment_id: punishmentId,
          punishment_type: punishmentType,
          appeal_text: appealText,
        },
      })

      if (error) throw error

      toast({
        title: "Appeal Submitted",
        description: "Your appeal has been submitted and will be reviewed by administrators.",
      })

      setIsOpen(false)
      setAppealText("")
    } catch (error) {
      console.error("Error submitting appeal:", error)
      toast({
        title: "Error",
        description: "Failed to submit appeal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2 bg-transparent">
          <MessageSquare className="h-4 w-4 mr-2" />
          Appeal {punishmentType}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appeal {punishmentType}</DialogTitle>
          <DialogDescription>
            Please explain why you believe this {punishmentType} should be reviewed or reversed. Appeals are reviewed by
            administrators and may take some time to process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="appeal">Your Appeal</Label>
            <Textarea
              id="appeal"
              placeholder="Explain your situation and why you believe this punishment should be reconsidered..."
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              className="min-h-[120px] mt-2"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground mt-1">{appealText.length}/1000 characters</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitAppeal} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Appeal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
