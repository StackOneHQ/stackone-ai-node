/** Whether a parsed JSON value is an object whose fields can be read. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

/** A field of a parsed JSON request body, or undefined when the body is not an object. */
export const bodyField = (body: unknown, key: string): unknown =>
	isRecord(body) ? body[key] : undefined;

/** Whether a parsed OpenAI request body offers the model at least one tool. */
export const offersTools = (body: unknown): boolean => {
	const tools = bodyField(body, 'tools');
	return Array.isArray(tools) && tools.length > 0;
};

const isInputText = (content: unknown): content is Record<string, unknown> =>
	isRecord(content) && content.type === 'input_text';

/** The text of a user message: its string content, or the text of its first `input_text` part. */
const userMessageText = (item: unknown): string | undefined => {
	if (!isRecord(item) || item.role !== 'user') {
		return undefined;
	}
	// For chat completions format
	if (typeof item.content === 'string') {
		return item.content;
	}
	if (!Array.isArray(item.content)) {
		return undefined;
	}
	const parts: unknown[] = item.content;
	const inputText = parts.find(isInputText);
	if (inputText === undefined) {
		return undefined;
	}
	return typeof inputText.text === 'string' ? inputText.text : '';
};

/**
 * Helper to extract text content from OpenAI responses API input
 */
export const extractTextFromInput = (input: unknown): string => {
	// Handle string input directly (OpenAI Responses API can accept plain strings)
	if (typeof input === 'string') {
		return input;
	}
	if (!Array.isArray(input)) {
		return '';
	}
	const items: unknown[] = input;
	for (const item of items) {
		const text = userMessageText(item);
		if (text !== undefined) {
			return text;
		}
	}
	return '';
};
