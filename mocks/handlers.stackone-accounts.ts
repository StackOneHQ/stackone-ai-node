import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from './constants';

/**
 * What `GET /accounts` serves: a bare list, with one account that is not active. An SDK that
 * discovers accounts must filter on status, and one that fans out over every id is caught here.
 */
export const mockAccounts = [
	{ id: 'default', provider: 'testprovider', status: 'active' },
	{ id: 'dead', provider: 'brokenprovider', status: 'error' },
];

export const stackoneAccountsHandlers = [
	http.get(`${TEST_BASE_URL}/accounts`, ({ request }) => {
		if (!request.headers.get('Authorization')?.startsWith('Basic ')) {
			return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}
		return HttpResponse.json(mockAccounts);
	}),
];
