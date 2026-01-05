import { z } from 'zod/v4-mini';
import { stackOneHeadersSchema } from './headers';

/**
 * Zod schema for RPC action request validation
 * @see https://docs.stackone.com/platform/api-reference/actions/make-an-rpc-call-to-an-action
 */
export const rpcActionRequestSchema = z.object({
	action: z.string(),
	body: z.optional(z.record(z.string(), z.unknown())),
	headers: z.optional(stackOneHeadersSchema),
	path: z.optional(z.record(z.string(), z.unknown())),
	query: z.optional(z.record(z.string(), z.unknown())),
});

/**
 * RPC action request payload
 */
export type RpcActionRequest = z.infer<typeof rpcActionRequestSchema>;

/**
 * Zod schema for RPC action response data
 */
const rpcActionResponseDataSchema = z.union([
	z.record(z.string(), z.unknown()),
	z.array(z.record(z.string(), z.unknown())),
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
 */
export const rpcActionResponseSchema = z.looseObject({
	next: z.nullable(z.optional(z.string())),
	data: z.optional(rpcActionResponseDataSchema),
});

/**
 * RPC action response from the StackOne API
 * Contains known fields (data, next) plus any additional fields from the connector
 */
export type RpcActionResponse = z.infer<typeof rpcActionResponseSchema>;

/**
 * Zod schema for RPC client configuration validation
 */
export const rpcClientConfigSchema = z.object({
	serverURL: z.optional(z.string()),
	security: z.object({
		username: z.string(),
		password: z.optional(z.string()),
	}),
});

/**
 * Configuration for the RPC client
 */
export type RpcClientConfig = z.infer<typeof rpcClientConfigSchema>;
