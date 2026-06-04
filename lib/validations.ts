import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(120),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
export const createSessionSchema = z.object({
  title: z.string().min(1).max(120).optional(),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(4000, "Message is too long"),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
export const feedbackSchema = z.object({
  rating: z.enum(["HELPFUL", "NOT_HELPFUL"]),
  comment: z.string().max(1000).optional(),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;

// ---------------------------------------------------------------------------
// Document upload constraints
// ---------------------------------------------------------------------------
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const ALLOWED_MIME_TYPES = ["application/pdf"] as const;
