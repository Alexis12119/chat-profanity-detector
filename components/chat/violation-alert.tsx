"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, Shield } from "lucide-react"

interface ViolationAlertProps {
  violations: Array<{
    type: string
    description: string
    severity: number
  }>
  isBlocked: boolean
  onDismiss: () => void
}

export function ViolationAlert({ violations, isBlocked, onDismiss }: ViolationAlertProps) {
  const maxSeverity = Math.max(...violations.map((v) => v.severity))

  return (
    <div className="p-4 border-b border-border">
      <Alert variant={isBlocked ? "destructive" : "default"} className="relative">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isBlocked ? <Shield className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>

          <div className="flex-1">
            <AlertTitle>{isBlocked ? "Message Blocked" : "Content Warning"}</AlertTitle>
            <AlertDescription className="mt-2">
              {isBlocked ? (
                <div>
                  <p className="mb-2">Your message was blocked due to policy violations:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {violations.map((violation, index) => (
                      <li key={index}>
                        <span className="font-medium capitalize">{violation.type.replace("_", " ")}:</span>{" "}
                        {violation.description}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm">Please review our community guidelines and try again.</p>
                </div>
              ) : (
                <div>
                  <p className="mb-2">Your message contains content that may violate our guidelines:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {violations.map((violation, index) => (
                      <li key={index}>
                        <span className="font-medium capitalize">{violation.type.replace("_", " ")}:</span>{" "}
                        {violation.description}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm">
                    Your message was sent, but please be mindful of our community standards.
                  </p>
                </div>
              )}
            </AlertDescription>
          </div>

          <Button variant="ghost" size="sm" onClick={onDismiss} className="flex-shrink-0 h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  )
}
