import { server } from './mocks/node';

// A STACKONE_ACCOUNT_ID in the developer's shell would make every toolset built without an
// account warn. Tests that need it stub it themselves.
delete process.env.STACKONE_ACCOUNT_ID;

// An unmocked request to a remote API fails the test, so an example cannot reach a real one.
// Loopback stays open for the tests that start their own server.
beforeAll(() =>
	server.listen({
		onUnhandledRequest: (request, print) => {
			if (new URL(request.url).hostname !== '127.0.0.1') {
				print.error();
			}
		},
	}),
);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
