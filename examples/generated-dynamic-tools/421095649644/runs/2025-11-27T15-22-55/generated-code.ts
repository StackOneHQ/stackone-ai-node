
import * as F from './421095649644/index.ts';
import { DynamicToolClient } from '@stackone/ai';

const client = new DynamicToolClient({
  apiKey: Bun.env.STACKONE_API_KEY!,
  accountId: '421095649644',
  baseUrl: Bun.env.STACKONE_BASE_URL,
});

const result = await F.unifiedHrisListEmployees(client, {
  query: {
    fields: 'id,first_name,last_name,name,department,hire_date',
    filter: {
      updated_after: '2024-01-01'
    },
    page_size: '100',
    next: '',
    expand: '',
    include: ''
  }
});

const employees = result.data || [];
const filteredEmployees = employees
  .filter((emp: any) => emp.hire_date && new Date(emp.hire_date) > new Date('2024-01-01'))
  .map((emp: any) => ({
    name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
    department: emp.department,
    hire_date: emp.hire_date
  }));

console.log(JSON.stringify(filteredEmployees, null, 2));
