
import * as F from './421095649644/index.ts';
import { DynamicToolClient } from '@stackone/ai';

const client = new DynamicToolClient({
  apiKey: Bun.env.STACKONE_API_KEY!,
  accountId: '421095649644',
  baseUrl: Bun.env.STACKONE_BASE_URL,
});

const result = await F.unifiedHrisGetEmployees(client, {
  path: {
    id: 'c28xIQaWQ6NA',
  },
  query: {
    fields: '',
    expand: '',
    include: '',
  },
});

console.log(JSON.stringify(result, null, 2));
