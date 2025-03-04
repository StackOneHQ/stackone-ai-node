import fs from 'node:fs';
import path from 'node:path';

const DOCS_DIR = path.join(process.cwd(), '.docs');
const EXAMPLES_DIR = path.join(process.cwd(), 'examples');

interface JSDocBlock {
  fullMatch: string;
  content: string;
  start: number;
  end: number;
}

/**
 * Convert a TypeScript file to markdown, preserving structure.
 */
export const convertFileToMarkdown = (tsFile: string): string => {
  // If the input is a multi-line string with JSDoc blocks, assume it's content
  // Otherwise, assume it's a file path
  const isContentString = tsFile.includes('/**') && tsFile.includes('*/');
  const content = isContentString ? tsFile : fs.readFileSync(tsFile, 'utf-8');

  // Add title from filename
  const fileName = isContentString ? 'index' : path.basename(tsFile, '.ts');
  let title: string;
  if (fileName === 'index') {
    title = 'StackOne AI SDK';
  } else {
    title = fileName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const output: string[] = [`# ${title}\n`];

  // Extract JSDoc comments and the code between them
  const jsDocRegex = /\/\*\*([\s\S]*?)\*\//g;
  let jsDocMatch: RegExpExecArray | null;

  // Array to store all JSDoc comments and their positions
  const jsDocBlocks: JSDocBlock[] = [];

  jsDocMatch = jsDocRegex.exec(content);
  while (jsDocMatch !== null) {
    jsDocBlocks.push({
      fullMatch: jsDocMatch[0],
      content: jsDocMatch[1],
      start: jsDocMatch.index,
      end: jsDocMatch.index + jsDocMatch[0].length,
    });
    jsDocMatch = jsDocRegex.exec(content);
  }

  // Process each JSDoc block and the code after it
  for (let i = 0; i < jsDocBlocks.length; i++) {
    const jsDoc = jsDocBlocks[i];

    // Process the docstring content (remove * from the beginning of lines)
    const cleanedDocstring = jsDoc.content
      .split('\n')
      .map((line) => line.trim().replace(/^\s*\*\s?/, ''))
      .join('\n')
      .trim();

    // Add an extra newline between sections if it starts with a header
    if (cleanedDocstring.trim().startsWith('#') && i > 0) {
      output.push(`\n${cleanedDocstring}`);
    } else {
      output.push(cleanedDocstring);
    }

    // Get the code between this JSDoc block and the next one (or the end of file)
    const codeStart = jsDoc.end;
    const codeEnd = i < jsDocBlocks.length - 1 ? jsDocBlocks[i + 1].start : content.length;

    const code = content.substring(codeStart, codeEnd).trim();
    if (code) {
      output.push('\n```typescript');
      output.push(code);
      output.push('```');
    }
  }

  // If no JSDoc blocks were found, just add the content as code
  if (jsDocBlocks.length === 0) {
    output.push('\n```typescript');
    output.push(content);
    output.push('```');
  }

  return output.join('\n');
};

/**
 * Convert a TypeScript file to markdown documentation.
 */
const createMarkdownFile = (tsFile: string): void => {
  const markdownContent = convertFileToMarkdown(tsFile);

  // Output to .docs directory
  const fileName = path.basename(tsFile, '.ts');
  const outputPath = path.join(DOCS_DIR, `${fileName}.md`);

  // Create directory if needed
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Write the file
  fs.writeFileSync(outputPath, markdownContent);
  console.log(`Created ${outputPath}`);
};

/**
 * Main function to build documentation.
 */
const main = (): void => {
  // Create docs directory if it doesn't exist
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  // Process all TypeScript files in examples directory
  const files = fs.readdirSync(EXAMPLES_DIR);

  for (const file of files) {
    if (file.endsWith('.ts') && !file.startsWith('test_')) {
      createMarkdownFile(path.join(EXAMPLES_DIR, file));
    }
  }
};

// Run the script
if (require.main === module) {
  main();
}
