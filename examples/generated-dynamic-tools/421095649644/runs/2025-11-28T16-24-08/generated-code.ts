
import * as F from './421095649644/index.ts';
import { DynamicToolClient } from '@stackone/ai';

async function main() {
  const client = new DynamicToolClient({
    apiKey: Bun.env.STACKONE_API_KEY,
    accountId: '421095649644',
    baseUrl: Bun.env.STACKONE_BASE_URL,
  });

  try {
    // Fetch department groups and work locations in parallel
    const [departmentsResult, locationsResult] = await Promise.all([
      F.unifiedHrisListGroupsDepartments(client, {
        query: {
          fields: '',
          filter: null,
          page_size: '100',
          next: '',
        },
      }),
      F.unifiedHrisListLocations(client, {
        query: {
          fields: '',
          filter: null,
          page_size: '100',
          next: '',
        },
      }),
    ]);

    // Extract data from responses
    const departments = departmentsResult.data || [];
    const locations = locationsResult.data || [];

    // Generate summary
    const summary = {
      departmentGroups: {
        total: departments.length,
        items: departments,
      },
      workLocations: {
        total: locations.length,
        items: locations,
      },
      summary: {
        totalDepartmentGroups: departments.length,
        totalWorkLocations: locations.length,
      },
    };

    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
