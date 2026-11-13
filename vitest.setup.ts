import { server } from './mocks/node';

// A STACKONE_ACCOUNT_ID in the developer's shell would make every toolset built without an
// account warn. Tests that need it stub it themselves.
delete process.env.STACKONE_ACCOUNT_ID;

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
