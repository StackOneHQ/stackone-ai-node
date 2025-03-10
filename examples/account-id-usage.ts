#!/usr/bin/env bun
/**
 * Example demonstrating different ways to set the account ID when using StackOne tools.
 *
 * This example shows:
 * 1. Setting account ID when initializing the toolset
 * 2. Setting account ID when getting tools
 * 3. Using setAccountId method directly on a tool
 *
 * Usage:
 *
 * ```bash
 * bun run examples/account-id-usage.ts
 * ```
 */

import assert from 'node:assert';
import { StackOneToolSet } from '../src';

const accountIdUsage = async (): Promise<void> => {
  /*
   * Set account ID on toolset initialization
   */
  const toolset = new StackOneToolSet({ accountId: 'initial-account-id' });

  const tools = toolset.getTools('hris_*');
  const employeeTool = tools.getStackOneTool('hris_list_employees');

  assert(
    employeeTool.getAccountId() === 'initial-account-id',
    'Account ID should match what was set'
  );

  /*
   * Setting account ID when getting tools (overrides toolset account ID)
   */
  const toolsWithOverride = toolset.getStackOneTools('hris_*', 'override-account-id');
  const employeeToolWithOverride = toolsWithOverride.getStackOneTool('hris_list_employees');

  assert(
    employeeToolWithOverride?.getAccountId() === 'override-account-id',
    'Account ID should match what was set'
  );

  /*
   * Set the account ID directly on the tool
   */
  employeeTool.setAccountId('direct-account-id');

  assert(
    employeeTool.getAccountId() === 'direct-account-id',
    'Account ID should match what was set'
  );
};

accountIdUsage();
