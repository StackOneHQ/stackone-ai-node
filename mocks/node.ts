import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { TEST_BASE_URL } from './constants';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

/** Serve `accounts` from GET /accounts for the rest of the test. */
export const serveAccounts = (accounts: object[]): void => {
	server.use(http.get(`${TEST_BASE_URL}/accounts`, () => HttpResponse.json(accounts)));
};
