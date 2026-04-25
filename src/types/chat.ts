import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  systemPromptAddition: z.string(),
});

export type Template = z.infer<typeof TemplateSchema>;

export type ChatPhase = "questioning" | "generating" | "idle";

export type ChatMode = "direct" | "plan" | "coaching";

export type AiPersona = "strict-cpo" | "balanced" | "supportive-mentor";

export type Verbosity = "concise" | "normal" | "detailed";

export interface ChatState {
  messages: Message[];
  phase: ChatPhase;
  isLoading: boolean;
  document: string;
  selectedTemplate: Template | null;
  mode: ChatMode;
}
