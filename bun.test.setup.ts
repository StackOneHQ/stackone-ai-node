import { beforeAll, afterEach, afterAll } from 'bun:test'
import { server } from './mocks/node.ts'

// Provide safe fallbacks in CI/sandbox (only if null/undefined)
process.env.OPENAI_API_KEY ??= 'test-openai-key'
process.env.STACKONE_API_KEY ??= 'test-stackone-key'

// Allow tests to skip LLM-heavy example files by default
process.env.SKIP_LLM_EXAMPLES ??= '1'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
