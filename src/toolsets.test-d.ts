import { expectTypeOf } from 'vitest';
import type { StackOneToolSetConfig } from './toolsets';

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
