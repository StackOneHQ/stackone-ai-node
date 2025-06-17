import { describe, expect, it } from 'bun:test';
import { convertFileToMarkdown } from './build-docs';

describe('convertFileToMarkdown', () => {
  it('should properly convert docstrings to markdown', () => {
    const input = `/**
 * # Installation
 *
 * \`\`\`bash
 * # Using npm
 * npm install @stackone/ai
 * \`\`\`
 *
 * # Authentication
 *
 * Set the \`STACKONE_API_KEY\` environment variable:
 *
 * \`\`\`bash
 * export STACKONE_API_KEY=<your-api-key>
 * \`\`\`
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();`;

    // Adjust the expected output to match our new format with extra spacing between sections
    const expected = `# StackOne AI SDK

# Installation

\`\`\`bash
# Using npm
npm install @stackone/ai
\`\`\`

# Authentication

Set the \`STACKONE_API_KEY\` environment variable:

\`\`\`bash
export STACKONE_API_KEY=<your-api-key>
\`\`\`

\`\`\`typescript
// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();
\`\`\``;

    const result = convertFileToMarkdown(input);
    expect(result).toBe(expected);
  });
});
