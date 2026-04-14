"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender: "user" | "admin"
  timestamp: string
  type: "text" | "file"
  fileName?: string
}

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Hi! I need help with my order ORD-001",
    sender: "user",
    timestamp: "10:30 AM",
    type: "text",
  },
  {
    id: "2",
    content: "Hello! Sure, I can help you with that. What seems to be the issue?",
    sender: "admin",
    timestamp: "10:31 AM",
    type: "text",
  },
  {
    id: "3",
    content: "I wanted to add some additional requirements to my assignment. Is that possible?",
    sender: "user",
    timestamp: "10:32 AM",
    type: "text",
  },
  {
    id: "4",
    content: "Absolutely! You can share the additional requirements here and I will forward them to our team.",
    sender: "admin",
    timestamp: "10:33 AM",
    type: "text",
  },
  {
    id: "5",
    content: "additional_requirements.pdf",
    sender: "user",
    timestamp: "10:35 AM",
    type: "file",
    fileName: "additional_requirements.pdf",
  },
  {
    id: "6",
    content: "Got it! I have received the file. Our team will review the additional requirements and update you shortly.",
    sender: "admin",
    timestamp: "10:36 AM",
    type: "text",
  },
]

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "text",
    }

    setMessages(prev => [...prev, message])
    setNewMessage("")

    // Simulate admin response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for your message! Our team will get back to you shortly.",
        sender: "admin",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "text",
      }
      setMessages(prev => [...prev, response])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/support-avatar.png" alt="Support" />
              <AvatarFallback className="bg-primary text-primary-foreground">SH</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-foreground">Support Team</h1>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="space-y-4">
          {/* Date separator */}
          <div className="flex items-center justify-center">
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
              Today
            </span>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border text-card-foreground rounded-bl-sm"
                )}
              >
                {message.type === "file" ? (
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      message.sender === "user" 
                        ? "bg-primary-foreground/20" 
                        : "bg-primary/10"
                    )}>
                      <Paperclip className={cn(
                        "h-4 w-4",
                        message.sender === "user" ? "text-primary-foreground" : "text-primary"
                      )} />
                    </div>
                    <span className="text-sm">{message.fileName}</span>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
                <p className={cn(
                  "text-xs mt-1",
                  message.sender === "user" 
                    ? "text-primary-foreground/70" 
                    : "text-muted-foreground"
                )}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-16 bg-card border-t border-border p-4">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 h-11 rounded-full bg-muted border-0"
          />
          <Button 
            size="icon" 
            className="shrink-0 h-11 w-11 rounded-full bg-primary hover:bg-primary/90"
            onClick={handleSend}
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
