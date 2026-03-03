import { normalizeActionName } from './normalize';

describe('normalizeActionName', () => {
	test('strips versioned API name to MCP format', () => {
		expect(
			normalizeActionName('calendly_1.0.0_calendly_create_scheduling_link_global'),
		).toBe('calendly_create_scheduling_link');
	});

	test('handles multi-digit version numbers', () => {
		expect(normalizeActionName('bamboohr_2.10.3_bamboohr_list_employees_global')).toBe(
			'bamboohr_list_employees',
		);
	});

	test('returns input unchanged when no version pattern matches', () => {
		expect(normalizeActionName('bamboohr_create_employee')).toBe('bamboohr_create_employee');
	});

	test('returns input unchanged for empty string', () => {
		expect(normalizeActionName('')).toBe('');
	});

	test('returns input unchanged when missing _global suffix', () => {
		expect(normalizeActionName('calendly_1.0.0_calendly_create_link')).toBe(
			'calendly_1.0.0_calendly_create_link',
		);
	});

	test('returns input unchanged for uppercase names', () => {
		expect(normalizeActionName('Calendly_1.0.0_create_link_global')).toBe(
			'Calendly_1.0.0_create_link_global',
		);
	});

	test('handles connector with digits', () => {
		expect(normalizeActionName('api2cart_1.0.0_api2cart_get_products_global')).toBe(
			'api2cart_get_products',
		);
	});
});
