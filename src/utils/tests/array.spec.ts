import { describe, expect, it } from 'bun:test';
import { toArray } from '../array';

describe('toArray', () => {
  it('should return empty array for null or undefined', () => {
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray()).toEqual([]);
  });

  it('should return the same array if input is already an array', () => {
    const arr = [1, 2, 3];
    const result = toArray(arr);
    expect(result).toBe(arr); // Should be the same reference
    expect(result).toEqual([1, 2, 3]);
  });

  it('should wrap non-array values in an array', () => {
    expect(toArray(1)).toEqual([1]);
    expect(toArray('hello')).toEqual(['hello']);
    expect(toArray({ foo: 'bar' })).toEqual([{ foo: 'bar' }]);
    expect(toArray(true)).toEqual([true]);
  });

  it('should handle empty arrays', () => {
    const emptyArray: any[] = [];
    expect(toArray(emptyArray)).toBe(emptyArray);
    expect(toArray(emptyArray)).toEqual([]);
  });

  it('should preserve types', () => {
    const stringResult = toArray('test');
    // TypeScript should infer this as string[]
    const _: string[] = stringResult;

    const numberArrayResult = toArray([1, 2, 3]);
    // TypeScript should infer this as number[]
    const __: number[] = numberArrayResult;
  });
});
