#!/usr/bin/env bun
/**
 * Filters Example
 *
 * This example demonstrates how to use filters with the HRIS list employees endpoint.
 * It showcases the deep object serialization implementation that properly converts
 * nested filter objects to OpenAPI deepObject style query parameters.
 *
 * Key features demonstrated:
 * 1. Basic filter usage (updated_after, email, employee_number)
 * 2. Proxy parameter usage for provider-specific filters
 * 3. Complex nested filter combinations
 * 4. Proper serialization of filter objects to query parameters
 *
 * Usage:
 *
 * ```bash
 * bun run examples/filters.ts
 * ```
 */

import assert from 'node:assert';
import { StackOneToolSet } from '../src';
import { ACCOUNT_IDS } from './constants';

type DryRunResult = { url: string };

const hriseEmployeeFilters = async (): Promise<void> => {
  // Initialize the toolset
  const toolset = new StackOneToolSet();
  const accountId = ACCOUNT_IDS.TEST.VALID;

  // Get the HRIS tools with account ID
  const tools = toolset.getStackOneTools('hris_*', accountId);
  const employeesTool = tools.getTool('hris_list_employees');

  assert(employeesTool !== undefined, 'Expected to find hris_list_employees tool');

  console.log('🧪 Testing HRIS Employee Filters with Deep Object Serialization\n');

  /*
   * Example 1: Basic date filter
   * Demonstrates filtering employees updated after a specific date
   */
  console.log('1️⃣ Basic Date Filter Test');
  const basicDateFilter = (await employeesTool.execute(
    {
      filter: {
        updated_after: '2023-01-01T00:00:00.000Z',
      },
    },
    { dryRun: true }
  )) as DryRunResult;

  console.log('Filter object:', { filter: { updated_after: '2023-01-01T00:00:00.000Z' } });
  console.log('Serialized URL:', basicDateFilter.url);

  // Verify that the filter is properly serialized as deepObject style
  assert(
    basicDateFilter.url.includes('filter%5Bupdated_after%5D=2023-01-01T00%3A00%3A00.000Z'),
    'Expected URL to contain properly serialized date filter'
  );
  console.log('✅ Date filter serialized correctly\n');

  /*
   * Example 2: Email filter
   * Demonstrates filtering employees by email address
   */
  console.log('2️⃣ Email Filter Test');
  const emailFilter = (await employeesTool.execute(
    {
      filter: {
        email: 'john.doe@company.com',
      },
    },
    { dryRun: true }
  )) as DryRunResult;

  console.log('Filter object:', { filter: { email: 'john.doe@company.com' } });
  console.log('Serialized URL:', emailFilter.url);

  assert(
    emailFilter.url.includes('filter%5Bemail%5D=john.doe%40company.com'),
    'Expected URL to contain properly serialized email filter'
  );
  console.log('✅ Email filter serialized correctly\n');

  /*
   * Example 3: Employee number filter
   * Demonstrates filtering employees by employee number
   */
  console.log('3️⃣ Employee Number Filter Test');
  const employeeNumberFilter = (await employeesTool.execute(
    {
      filter: {
        employee_number: 'EMP001',
      },
    },
    { dryRun: true }
  )) as DryRunResult;

  console.log('Filter object:', { filter: { employee_number: 'EMP001' } });
  console.log('Serialized URL:', employeeNumberFilter.url);

  assert(
    employeeNumberFilter.url.includes('filter%5Bemployee_number%5D=EMP001'),
    'Expected URL to contain properly serialized employee number filter'
  );
  console.log('✅ Employee number filter serialized correctly\n');

  /*
   * Example 4: Multiple filters combined
   * Demonstrates using multiple filter parameters together
   */
  console.log('4️⃣ Multiple Filters Combined Test');
  const multipleFilters = (await employeesTool.execute(
    {
      filter: {
        updated_after: '2023-06-01T00:00:00.000Z',
        email: 'jane.smith@company.com',
        employee_number: 'EMP002',
      },
    },
    { dryRun: true }
  )) as DryRunResult;

  console.log('Filter object:', {
    filter: {
      updated_after: '2023-06-01T00:00:00.000Z',
      email: 'jane.smith@company.com',
      employee_number: 'EMP002',
    },
  });
  console.log('Serialized URL:', (multipleFilters as { url: string }).url);

  // Verify all filters are present in the URL
  assert(
    multipleFilters.url.includes('filter%5Bupdated_after%5D=2023-06-01T00%3A00%3A00.000Z'),
    'Expected URL to contain date filter'
  );
  assert(
    multipleFilters.url.includes('filter%5Bemail%5D=jane.smith%40company.com'),
    'Expected URL to contain email filter'
  );
  assert(
    multipleFilters.url.includes('filter%5Bemployee_number%5D=EMP002'),
    'Expected URL to contain employee number filter'
  );
  console.log('✅ Multiple filters serialized correctly\n');

  /*
   * Example 5: Proxy parameters for provider-specific filtering
   * Demonstrates using proxy parameters which also use deepObject serialization
   */
  console.log('5️⃣ Proxy Parameters Test');
  const proxyParameters = (await employeesTool.execute(
    {
      proxy: {
        custom_field: 'value123',
        provider_filter: {
          department: 'Engineering',
          status: 'active',
        },
      },
    },
    { dryRun: true }
  )) as DryRunResult;

  console.log('Proxy object:', {
    proxy: {
      custom_field: 'value123',
      provider_filter: {
        department: 'Engineering',
        status: 'active',
      },
    },
  });
  console.log('Serialized URL:', proxyParameters.url);

  // Verify proxy parameters are properly serialized
  assert(
    proxyParameters.url.includes('proxy%5Bcustom_field%5D=value123'),
    'Expected URL to contain proxy custom_field parameter'
  );
  assert(
    proxyParameters.url.includes('proxy%5Bprovider_filter%5D%5Bdepartment%5D=Engineering'),
    'Expected URL to contain nested proxy department parameter'
  );
  assert(
    proxyParameters.url.includes('proxy%5Bprovider_filter%5D%5Bstatus%5D=active'),
    'Expected URL to contain nested proxy status parameter'
  );
  console.log('✅ Proxy parameters with nested objects serialized correctly\n');

  /*
   * Example 6: Complex combined scenario
   * Demonstrates combining filters, proxy parameters, and other query parameters
   */
  console.log('6️⃣ Complex Combined Scenario Test');
  const complexScenario = (await employeesTool.execute(
    {
      filter: {
        updated_after: '2023-09-01T00:00:00.000Z',
        email: 'admin@company.com',
      },
      proxy: {
        include_terminated: 'false',
        custom_sorting: {
          field: 'hire_date',
          order: 'desc',
        },
      },
      fields: 'id,first_name,last_name,email,hire_date',
      page_size: '50',
    },
    { dryRun: true }
  )) as DryRunResult;

  console.log('Complex parameters:', {
    filter: {
      updated_after: '2023-09-01T00:00:00.000Z',
      email: 'admin@company.com',
    },
    proxy: {
      include_terminated: 'false',
      custom_sorting: {
        field: 'hire_date',
        order: 'desc',
      },
    },
    fields: 'id,first_name,last_name,email,hire_date',
    page_size: '50',
  });
  console.log('Serialized URL:', complexScenario.url);

  // Verify complex scenario serialization
  assert(
    complexScenario.url.includes('filter%5Bupdated_after%5D=2023-09-01T00%3A00%3A00.000Z'),
    'Expected URL to contain complex date filter'
  );
  assert(
    complexScenario.url.includes('filter%5Bemail%5D=admin%40company.com'),
    'Expected URL to contain complex email filter'
  );
  assert(
    complexScenario.url.includes('proxy%5Binclude_terminated%5D=false'),
    'Expected URL to contain proxy boolean parameter'
  );
  assert(
    complexScenario.url.includes('proxy%5Bcustom_sorting%5D%5Bfield%5D=hire_date'),
    'Expected URL to contain nested proxy field parameter'
  );
  assert(
    complexScenario.url.includes('proxy%5Bcustom_sorting%5D%5Border%5D=desc'),
    'Expected URL to contain nested proxy order parameter'
  );
  assert(
    complexScenario.url.includes('fields=id%2Cfirst_name%2Clast_name%2Cemail%2Chire_date'),
    'Expected URL to contain fields parameter'
  );
  assert(
    complexScenario.url.includes('page_size=50'),
    'Expected URL to contain page_size parameter'
  );
  console.log('✅ Complex combined scenario serialized correctly\n');

  /*
   * Example 7: Edge case - Empty filter objects
   * Demonstrates handling of empty filter objects
   */
  console.log('7️⃣ Edge Case - Empty Filter Objects Test');
  const emptyFilterTest = (await employeesTool.execute(
    {
      filter: {},
      fields: 'id,first_name,last_name',
    },
    { dryRun: true }
  )) as DryRunResult;

  console.log('Empty filter object:', { filter: {}, fields: 'id,first_name,last_name' });
  console.log('Serialized URL:', emptyFilterTest.url);

  // Verify that empty filter objects don't create problematic parameters
  assert(
    emptyFilterTest.url.includes('fields=id%2Cfirst_name%2Clast_name'),
    'Expected URL to contain fields parameter even with empty filter'
  );
  // Empty objects should not create parameters
  assert(
    !emptyFilterTest.url.includes('filter='),
    'Expected URL to not contain empty filter parameter'
  );
  console.log('✅ Empty filter objects handled correctly\n');
};

// Run the example
hriseEmployeeFilters();
