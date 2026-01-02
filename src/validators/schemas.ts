import { z } from 'zod';

// Media upload metadata schema
export const uploadMetadataSchema = z.object({
  title: z.string().max(100, 'Title must be at most 100 characters').optional(),
  caption: z.string().max(500, 'Caption must be at most 500 characters'),
  location: z.string().max(100, 'Location must be at most 100 characters').optional(),
  people: z.array(z.string()).max(20, 'Maximum 20 people tags').optional(),
});

export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;

// Comment creation schema
export const commentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment must be at most 500 characters'),
});

export type CommentPayload = z.infer<typeof commentSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginPayload = z.infer<typeof loginSchema>;

// Signup schema
export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type SignupPayload = z.infer<typeof signupSchema>;
