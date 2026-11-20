import { z } from "zod";

export const loginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  securityToken: z.string().optional(),
  csrfToken: z.string().optional(),
});

export const registerRequest = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(4),
  confirmPassword: z.string().min(4),
  acceptTerms: z.literal(true),
  csrfToken: z.string().optional(),
}).refine((b) => b.password === b.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotRequest = z.object({
  email: z.string().email(),
  csrfToken: z.string().optional(),
});

export const resetPasswordRequest = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(4),
  csrfToken: z.string().optional(),
});

export const changePasswordRequest = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4),
  csrfToken: z.string().optional(),
});

export const verifyEmailRequest = z.object({
  token: z.string().min(1),
});

export const twoFactorCodeRequest = z.object({
  token: z.string().min(1),
  csrfToken: z.string().optional(),
});
