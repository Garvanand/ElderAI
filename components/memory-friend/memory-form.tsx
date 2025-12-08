"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"

type MemoryType = "object" | "event" | "reminder" | "other"

interface MemoryFormProps {
  onSubmit: (data: { text: string; type?: MemoryType }) => void
}

export function MemoryForm({ onSubmit }: MemoryFormProps) {
  const [text, setText] = useState("")
  const [type, setType] = useState<MemoryType | undefined>(undefined)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit({ text: text.trim(), type })
      setText("")
      setType(undefined)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-8">
      {/* Memory Text Input */}
      <div className="space-y-3">
        <Label htmlFor="memory-text" className="text-xl md:text-2xl font-medium text-foreground">
          What would you like to remember?
        </Label>
        <Textarea
          id="memory-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your memory here..."
          className="min-h-[160px] text-lg md:text-xl p-4 resize-none"
          aria-describedby="memory-hint"
          required
        />
        <p id="memory-hint" className="text-base text-muted-foreground">
          Write anything you want to remember - a name, a place, an event, or a reminder.
        </p>
      </div>

      {/* Optional Type Dropdown */}
      <div className="space-y-3">
        <Label htmlFor="memory-type" className="text-lg md:text-xl font-medium text-foreground">
          Type <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Select value={type} onValueChange={(value: MemoryType) => setType(value)}>
          <SelectTrigger id="memory-type" className="h-14 text-lg">
            <SelectValue placeholder="Select a type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="object" className="text-lg py-3">
              Object
            </SelectItem>
            <SelectItem value="event" className="text-lg py-3">
              Event
            </SelectItem>
            <SelectItem value="reminder" className="text-lg py-3">
              Reminder
            </SelectItem>
            <SelectItem value="other" className="text-lg py-3">
              Other
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-16 text-xl md:text-2xl font-semibold gap-3"
        disabled={!text.trim()}
        aria-label="Save this memory"
      >
        <Save className="h-6 w-6" aria-hidden="true" />
        Save Memory
      </Button>
    </form>
  )
}
