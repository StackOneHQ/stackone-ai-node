/**
 * E2E test for defender-config.ts example.
 *
 * Exercises the same defender configuration patterns the example
 * demonstrates and asserts the resulting wire payloads via dryRun.
 * Construction-time `defenderMode` and override-warning behavior is
 * covered in `src/toolsets.test.ts`.
 */

import { TEST_BASE_URL } from '../../mocks/constants';
import { DEFAULT_DEFENDER_CONFIG, StackOneToolSet, ToolSetConfigError } from '../../src';

describe('defender-config example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
		// Silence override warnings so they don't pollute test output.
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	const fetchDummyTool = async (toolset: StackOneToolSet) => {
		const tools = await toolset.fetchTools();
		const tool = tools.toArray().find((t) => t.name === 'dummy_action');
		assert(tool, 'dummy_action tool should be defined in mocks');
		return tool;
	};

	it('omits defender_config when defender is not passed (mode 1)', async () => {
		const toolset = new StackOneToolSet({
			baseUrl: TEST_BASE_URL,
			accountId: 'test-account',
		});
		expect(toolset.defenderMode).toBe('project');

		const tool = await fetchDummyTool(toolset);
		const result = await tool.execute({ body: { name: 'test' } }, { dryRun: true });
		const parsedBody = JSON.parse(result.body as string);
		expect(parsedBody).not.toHaveProperty('defender_config');
	});

	it('omits defender_config when defender is { useProjectSettings: true } (mode 2)', async () => {
		const toolset = new StackOneToolSet({
			baseUrl: TEST_BASE_URL,
			accountId: 'test-account',
			defender: { useProjectSettings: true },
		});
		expect(toolset.defenderMode).toBe('project');

		const tool = await fetchDummyTool(toolset);
		const result = await tool.execute({ body: { name: 'test' } }, { dryRun: true });
		const parsedBody = JSON.parse(result.body as string);
		expect(parsedBody).not.toHaveProperty('defender_config');
	});

	it('sends all-false defender_config when defender is null (mode 3)', async () => {
		const toolset = new StackOneToolSet({
			baseUrl: TEST_BASE_URL,
			accountId: 'test-account',
			defender: null,
		});
		expect(toolset.defenderMode).toBe('disabled');

		const tool = await fetchDummyTool(toolset);
		const result = await tool.execute({ body: { name: 'test' } }, { dryRun: true });
		const parsedBody = JSON.parse(result.body as string);
		expect(parsedBody.defender_config).toEqual({
			enabled: false,
			block_high_risk: false,
			use_tier1_classification: false,
			use_tier2_classification: false,
		});
	});

	it('applies DEFAULT_DEFENDER_CONFIG fallbacks with explicit overrides (mode 4)', async () => {
		const toolset = new StackOneToolSet({
			baseUrl: TEST_BASE_URL,
			accountId: 'test-account',
			defender: { ...DEFAULT_DEFENDER_CONFIG, blockHighRisk: true },
		});
		expect(toolset.defenderMode).toBe('explicit');

		const tool = await fetchDummyTool(toolset);
		const result = await tool.execute({ body: { name: 'test' } }, { dryRun: true });
		const parsedBody = JSON.parse(result.body as string);
		expect(parsedBody.defender_config).toEqual({
			enabled: true,
			block_high_risk: true,
			use_tier1_classification: true,
			use_tier2_classification: true,
		});
	});

	it('sends the exact explicit fields for a fully specified config (mode 6)', async () => {
		const toolset = new StackOneToolSet({
			baseUrl: TEST_BASE_URL,
			accountId: 'test-account',
			defender: {
				enabled: true,
				blockHighRisk: false,
				useTier1Classification: true,
				useTier2Classification: false,
			},
		});
		expect(toolset.defenderMode).toBe('explicit');

		const tool = await fetchDummyTool(toolset);
		const result = await tool.execute({ body: { name: 'test' } }, { dryRun: true });
		const parsedBody = JSON.parse(result.body as string);
		expect(parsedBody.defender_config).toEqual({
			enabled: true,
			block_high_risk: false,
			use_tier1_classification: true,
			use_tier2_classification: false,
		});
	});

	it('throws ToolSetConfigError when useProjectSettings is combined with other fields (mode 7)', () => {
		expect(
			() =>
				new StackOneToolSet({
					apiKey: 'demo-key',
					// @ts-expect-error - intentionally testing invalid runtime input
					defender: { useProjectSettings: true, enabled: true },
				}),
		).toThrow(ToolSetConfigError);
	});

	it('surfaces defenderMetadata alongside data in live RPC responses (mode 8)', async () => {
		const toolset = new StackOneToolSet({
			baseUrl: TEST_BASE_URL,
			accountId: 'test-account',
			defender: { ...DEFAULT_DEFENDER_CONFIG, blockHighRisk: false },
		});

		const tools = await toolset.fetchTools();
		const tool = tools.toArray().find((t) => t.name === 'dummy_action');
		assert(tool, 'dummy_action tool should be defined in mocks');

		const result = await tool.execute({ body: { name: 'test' } });
		const metadata = (result as { defenderMetadata?: Record<string, unknown> }).defenderMetadata;

		expect(metadata).toBeDefined();
		assert(metadata, 'defenderMetadata should be defined');
		expect(metadata.applied).toBe(true);
		expect(metadata.result).toMatchObject({
			allowed: true,
			riskLevel: expect.stringMatching(/^(low|medium|high|critical)$/),
			fieldsSanitized: expect.any(Array),
		});
	});
});
