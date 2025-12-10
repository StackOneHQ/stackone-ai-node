import { z } from 'zod/mini';

/**
 * Known StackOne API header keys that are forwarded as HTTP headers
 */
export const STACKONE_HEADER_KEYS = ['x-account-id'] as const;

/**
 * Zod schema for StackOne API headers (branded)
 * These headers are forwarded as HTTP headers in API requests
 */
export const stackOneHeadersSchema = z.record(z.string(), z.string()).brand<'StackOneHeaders'>();

/**
 * Branded type for StackOne API headers
 */
export type StackOneHeaders = z.infer<typeof stackOneHeadersSchema>;
