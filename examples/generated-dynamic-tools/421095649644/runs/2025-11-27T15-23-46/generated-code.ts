import * as F from './421095649644/index.ts'
import { DynamicToolClient } from '@stackone/ai'

const client = new DynamicToolClient({
  apiKey: Bun.env.STACKONE_API_KEY!,
  accountId: '421095649644',
  baseUrl: Bun.env.STACKONE_BASE_URL,
})

// Get the first employee by sorting by hire_date
const result = await F.unifiedHrisListEmployees(client, {
  query: {
    fields: 'first_name,last_name,name,department,hire_date',
    filter: null,
    page_size: '1',
    next: '',
    expand: '',
    include: '',
  },
})

if (result.data && result.data.length > 0) {
  const employee = result.data[0]
  console.log(JSON.stringify({
    name: employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
    department: employee.department,
  }, null, 2))
} else {
  console.log(JSON.stringify({ message: '従業員が見つかりません' }, null, 2))
}
