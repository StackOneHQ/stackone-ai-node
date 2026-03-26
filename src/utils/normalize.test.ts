import { normalizeActionName } from './normalize';

describe('normalizeActionName', () => {
	test('prepends connector when actionId has no prefix', () => {
		expect(normalizeActionName('slack_1.0.0_send_message_global')).toBe('slack_send_message');
	});

	test('does not duplicate connector when actionId already has prefix', () => {
		expect(normalizeActionName('calendly_1.0.0_calendly_create_scheduling_link_global')).toBe(
			'calendly_create_scheduling_link',
		);
	});

	test('handles multi-digit version numbers', () => {
		expect(normalizeActionName('bamboohr_2.10.3_bamboohr_list_employees_global')).toBe(
			'bamboohr_list_employees',
		);
	});

	test('handles actionId without connector prefix and multi-digit version', () => {
		expect(normalizeActionName('bamboohr_2.10.3_list_employees_global')).toBe(
			'bamboohr_list_employees',
		);
	});

	test('returns input unchanged when no version pattern matches', () => {
		expect(normalizeActionName('bamboohr_create_employee')).toBe('bamboohr_create_employee');
	});

	test('returns input unchanged for empty string', () => {
		expect(normalizeActionName('')).toBe('');
	});

	test('handles uppercase connector names', () => {
		expect(normalizeActionName('Calendly_1.0.0_create_link_global')).toBe(
			'Calendly_create_link',
		);
	});

	test('handles connector with digits', () => {
		expect(normalizeActionName('api2cart_1.0.0_api2cart_get_products_global')).toBe(
			'api2cart_get_products',
		);
	});

	test('handles connector with digits and no prefix in actionId', () => {
		expect(normalizeActionName('api2cart_1.0.0_get_products_global')).toBe(
			'api2cart_get_products',
		);
	});

	test('handles non-global project IDs', () => {
		expect(normalizeActionName('jira_1.0.0_search_issues_103/dev-56501')).toBe(
			'jira_search_issues',
		);
	});
});
