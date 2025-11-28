
import * as F from './421095649644/index.ts';
import { DynamicToolClient } from '@stackone/ai';

const client = new DynamicToolClient({
  apiKey: Bun.env.STACKONE_API_KEY!,
  accountId: '421095649644',
  baseUrl: Bun.env.STACKONE_BASE_URL,
});

// List employees hired after 2024-01-01 with work location information
const result = await F.unifiedHrisListEmployees(client, {
  query: {
    fields: 'id,first_name,last_name,hire_date,work_location',
    filter: {
      updated_after: '2024-01-01',
    },
    page_size: '100',
    next: '',
    expand: 'work_location',
    include: '',
  },
});

console.log(JSON.stringify(result, null, 2));
