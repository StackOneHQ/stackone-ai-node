/**
 * Benchmarks for TfidfIndex - build and search performance at various scales.
 */
import { bench, describe } from 'vitest';
import { TfidfIndex } from './tfidf-index';

function generateCorpus(size: number): { id: string; text: string }[] {
	const verbs = ['create', 'update', 'delete', 'get', 'list', 'search', 'fetch', 'sync'];
	const nouns = [
		'employee',
		'candidate',
		'contact',
		'document',
		'task',
		'event',
		'ticket',
		'account',
	];
	const integrations = [
		'bamboohr',
		'workday',
		'salesforce',
		'hubspot',
		'jira',
		'slack',
		'github',
		'zendesk',
	];

	return Array.from({ length: size }, (_, i) => {
		const integration = integrations[i % integrations.length] ?? 'bamboohr';
		const verb = verbs[i % verbs.length] ?? 'create';
		const noun = nouns[Math.floor(i / verbs.length) % nouns.length] ?? 'employee';
		const name = `${integration}_${verb}_${noun}`;
		return {
			id: name,
			text: `${name} ${verb} ${noun} in the ${integration} integration for ${noun} management`,
		};
	});
}

describe('TfidfIndex - build', () => {
	bench('build index with 10 documents', () => {
		const index = new TfidfIndex();
		index.build(generateCorpus(10));
	});

	bench('build index with 100 documents', () => {
		const index = new TfidfIndex();
		index.build(generateCorpus(100));
	});

	bench('build index with 500 documents', () => {
		const index = new TfidfIndex();
		index.build(generateCorpus(500));
	});
});

describe('TfidfIndex - search', () => {
	const smallIndex = new TfidfIndex();
	smallIndex.build(generateCorpus(10));

	const mediumIndex = new TfidfIndex();
	mediumIndex.build(generateCorpus(100));

	const largeIndex = new TfidfIndex();
	largeIndex.build(generateCorpus(500));

	bench('search in 10-document index', () => {
		smallIndex.search('create employee');
	});

	bench('search in 100-document index', () => {
		mediumIndex.search('create employee');
	});

	bench('search in 500-document index', () => {
		largeIndex.search('create employee');
	});
});
