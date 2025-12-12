/**
 * Helper to extract text content from OpenAI responses API input
 */
export const extractTextFromInput = (input: unknown): string => {
	// Handle string input directly (OpenAI Responses API can accept plain strings)
	if (typeof input === 'string') return input;
	if (!Array.isArray(input)) return '';
	for (const item of input) {
		if (typeof item === 'object' && item !== null) {
			const obj = item as Record<string, unknown>;
			if (obj.role === 'user' && Array.isArray(obj.content)) {
				for (const content of obj.content) {
					if (
						typeof content === 'object' &&
						content !== null &&
						(content as Record<string, unknown>).type === 'input_text'
					) {
						const textValue = (content as Record<string, unknown>).text;
						return typeof textValue === 'string' ? textValue : '';
					}
				}
			}
			// For chat completions format
			if (obj.role === 'user' && typeof obj.content === 'string') {
				return obj.content;
			}
		}
	}
	return '';
};
