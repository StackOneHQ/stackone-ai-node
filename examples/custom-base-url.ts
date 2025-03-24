#!/usr/bin/env bun
/**
 * Example demonstrating how to use a custom base URL with StackOne tools.
 *
 * This is useful for:
 * 1. Testing against development APIs
 * 2. Working with self-hosted StackOne instances
 *
 * Usage:
 *
 * ```bash
 * bun run examples/custom-base-url.ts
 * ```
 */

import assert from 'node:assert';
import { StackOneToolSet } from '../src';

const customBaseUrl = async (): Promise<void> => {
  /**
   * Default base URL
   */
  const defaultToolset = new StackOneToolSet();
  const hrisTools = defaultToolset.getTools('hris_*');

  assert(hrisTools.length > 0, 'Should have at least one HRIS tool');
  const defaultTool = hrisTools.getTool('hris_get_employee');
  if (!defaultTool) {
    throw new Error('Tool not found');
  }

  /**
   * Custom base URL
   */
  const devToolset = new StackOneToolSet({
    baseUrl: 'https://api.example-dev.com',
  });

  const devHrisTools = devToolset.getTools('hris_*');

  assert(devHrisTools.length > 0, 'Should have at least one HRIS tool');
  const devTool = devHrisTools.getTool('hris_get_employee');
  if (!devTool) {
    throw new Error('Tool not found');
  }

  /**
   * Note this uses the same tools but substitutes the base URL
   */
  if (defaultTool && devTool) {
    assert(defaultTool.name === devTool.name, 'Tool names should be the same');
    assert(
      defaultTool.executeConfig.url.includes('https://api.stackone.com'),
      'Default tool should use the default base URL'
    );
    assert(
      devTool.executeConfig.url.includes('https://api.example-dev.com'),
      'Custom tool should use the custom base URL'
    );
  }
};

customBaseUrl();
