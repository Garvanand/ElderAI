export interface Memory {
  id: string
  text: string
  type: "object" | "event" | "reminder" | "other"
  tags: string[]
  createdAt: Date
}

export interface Question {
  id: string
  question: string
  answer: string
  answeredAt: Date
}
