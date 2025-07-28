import { beforeAll, afterEach, afterAll } from 'bun:test'
import { server } from './mocks/node.js'
 
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
