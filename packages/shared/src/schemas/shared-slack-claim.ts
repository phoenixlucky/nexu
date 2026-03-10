import { z } from "zod";

// --- Generate claim key (called by gateway) ---

export const generateClaimKeySchema = z.object({
  teamId: z.string().min(1),
  teamName: z.string().optional(),
  slackUserId: z.string().min(1),
});

export type GenerateClaimKeyRequest = z.infer<typeof generateClaimKeySchema>;

export const generateClaimKeyResponseSchema = z.object({
  claimUrl: z.string(),
  key: z.string(),
  expiresAt: z.string(),
});

export type GenerateClaimKeyResponse = z.infer<
  typeof generateClaimKeyResponseSchema
>;

// --- Resolve / validate claim key (public, no auth) ---

export const resolveClaimKeyQuerySchema = z.object({
  key: z.string().min(1),
});

export const resolveClaimKeyResponseSchema = z.object({
  valid: z.boolean(),
  expired: z.boolean(),
  used: z.boolean(),
  teamId: z.string().optional(),
  teamName: z.string().nullable().optional(),
  slackUserId: z.string().optional(),
  isExistingWorkspace: z.boolean().optional(),
  memberCount: z.number().optional(),
});

export type ResolveClaimKeyResponse = z.infer<
  typeof resolveClaimKeyResponseSchema
>;

// --- Submit claim (authenticated) ---

export const sharedSlackClaimSchema = z.object({
  key: z.string().min(1),
});

export type SharedSlackClaimRequest = z.infer<typeof sharedSlackClaimSchema>;

export const sharedSlackClaimResponseSchema = z.object({
  ok: z.boolean(),
  orgAuthorized: z.boolean(),
});

export type SharedSlackClaimResponse = z.infer<
  typeof sharedSlackClaimResponseSchema
>;
