import { expectTypeOf } from 'vitest';
import type { StackOneToolSet, StackOneToolSetConfig } from './toolsets';
import type { ActionResult, JsonObject, JsonValue, SearchResult } from './types';

// Valid configurations - only accountId
test('StackOneToolSetConfig accepts only accountId', () => {
	expectTypeOf<{
		apiKey: string;
		accountId: string;
	}>().toExtend<StackOneToolSetConfig>();
});

// Valid configurations - only accountIds
test('StackOneToolSetConfig accepts only accountIds', () => {
	expectTypeOf<{
		apiKey: string;
		accountIds: string[];
	}>().toExtend<StackOneToolSetConfig>();
});

// Valid configurations - neither accountId nor accountIds
test('StackOneToolSetConfig accepts neither accountId nor accountIds', () => {
	expectTypeOf<{
		apiKey: string;
	}>().toExtend<StackOneToolSetConfig>();
});

// Invalid configuration - both accountId and accountIds should NOT extend
test('StackOneToolSetConfig rejects both accountId and accountIds', () => {
	expectTypeOf<{
		apiKey: string;
		accountId: string;
		accountIds: string[];
	}>().not.toExtend<StackOneToolSetConfig>();
});

// Verify accountId can be string or undefined
test('accountId is typed as string | undefined', () => {
	expectTypeOf<StackOneToolSetConfig['accountId']>().toEqualTypeOf<string | undefined>();
});

// Verify accountIds can be string[] or undefined
test('accountIds is typed as string[] | undefined', () => {
	expectTypeOf<StackOneToolSetConfig['accountIds']>().toEqualTypeOf<string[] | undefined>();
});

// A search hit's served fields are typed, so a caller needs no narrowing to read them
test('SearchResult declares the fields the server serves', () => {
	expectTypeOf<SearchResult['similarity_score']>().toEqualTypeOf<number | undefined>();
	expectTypeOf<SearchResult['description']>().toEqualTypeOf<string | undefined>();
	expectTypeOf<SearchResult['input_schema']>().toEqualTypeOf<JsonObject | undefined>();
	expectTypeOf<SearchResult['example_request']>().toExtend<
		Parameters<StackOneToolSet['execute']>[1]
	>();
});

// An action's result is the server's wrapper, typed so `result` needs no cast to reach
test('execute() and submitFeedback() return an ActionResult', () => {
	expectTypeOf<ReturnType<StackOneToolSet['execute']>>().toEqualTypeOf<Promise<ActionResult>>();
	expectTypeOf<ReturnType<StackOneToolSet['submitFeedback']>>().toEqualTypeOf<
		Promise<ActionResult>
	>();
	expectTypeOf<ActionResult['isError']>().toEqualTypeOf<false>();
	expectTypeOf<ActionResult['result']>().toEqualTypeOf<JsonValue>();
	expectTypeOf<ActionResult['defenderMetadata']>().toEqualTypeOf<JsonObject | undefined>();
	expectTypeOf<ActionResult['policyMetadata']>().toEqualTypeOf<JsonObject | undefined>();
	// Keys the server adds are kept, and a result is still a JsonObject.
	expectTypeOf<{ isError: false; result: null; extra: true }>().toExtend<ActionResult>();
	expectTypeOf<ActionResult>().toExtend<JsonObject>();
});
