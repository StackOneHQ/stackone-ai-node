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
import { ACCOUNT_IDS } from './constants';

const accountIdUsage = async (): Promise<void> => {
  /*
   * Set account ID on toolset initialization
   */
  const toolset = new StackOneToolSet({ accountId: ACCOUNT_IDS.TEST.VALID });

  const tools = toolset.getTools('hris_*');
  const employeeTool = tools.getStackOneTool('hris_list_employees');

  assert(
    employeeTool.getAccountId() === ACCOUNT_IDS.TEST.VALID,
    'Account ID should match what was set'
  );

  /*
   * Setting account ID when getting tools (overrides toolset account ID)
   */
  const toolsWithOverride = toolset.getStackOneTools('hris_*', ACCOUNT_IDS.TEST.OVERRIDE);
  const employeeToolWithOverride = toolsWithOverride.getStackOneTool('hris_list_employees');

  assert(
    employeeToolWithOverride?.getAccountId() === ACCOUNT_IDS.TEST.OVERRIDE,
    'Account ID should match what was set'
  );

  /*
   * Set the account ID directly on the tool
   */
  employeeTool.setAccountId(ACCOUNT_IDS.TEST.DIRECT);

  assert(
    employeeTool.getAccountId() === ACCOUNT_IDS.TEST.DIRECT,
    'Account ID should match what was set'
  );
};

accountIdUsage();
