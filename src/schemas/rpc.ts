import { z } from 'zod';

/**
 * Zod schema for RPC action request validation
 * @see https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action
 */
export const rpcActionRequestSchema = z.object({
  action: z.string(),
  body: z.record(z.unknown()).optional(),
  headers: z.record(z.unknown()).optional(),
  path: z.record(z.unknown()).optional(),
  query: z.record(z.unknown()).optional(),
});

/**
 * RPC action request payload
 */
export type RpcActionRequest = z.infer<typeof rpcActionRequestSchema>;

/**
 * Zod schema for RPC action response data
 */
const rpcActionResponseDataSchema = z.union([
  z.record(z.unknown()),
  z.array(z.record(z.unknown())),
  z.null(),
]);

/**
 * Zod schema for RPC action response validation
 *
 * The server returns a flexible JSON structure. Known fields:
 * - `data`: The main response data (object, array, or null)
 * - `next`: Pagination cursor for fetching next page
 *
 * Additional fields from the connector response are passed through.
 * @see unified-cloud-api/src/unified-api-v2/unifiedAPIv2.service.ts processActionCall
 */
export const rpcActionResponseSchema = z
  .object({
    next: z.string().nullish(),
    data: rpcActionResponseDataSchema.optional(),
  })
  .passthrough();

/**
 * RPC action response from the StackOne API
 * Contains known fields (data, next) plus any additional fields from the connector
 */
export type RpcActionResponse = z.infer<typeof rpcActionResponseSchema>;

/**
 * Zod schema for RPC client configuration validation
 */
export const rpcClientConfigSchema = z.object({
  serverURL: z.string().optional(),
  security: z.object({
    username: z.string(),
    password: z.string().optional(),
  }),
});

/**
 * Configuration for the RPC client
 */
export type RpcClientConfig = z.infer<typeof rpcClientConfigSchema>;
