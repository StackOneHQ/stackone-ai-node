import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { directoryExists, joinPaths } from './utils/file';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OAS files are in the top-level .oas directory
// This ensures consistency between local development and the published package
const determineOasDir = (): string => {
  // First, try to find the .oas directory relative to the module's parent directory
  // This handles both development and when used as a dependency
  const projectRoot = path.resolve(__dirname, '..');
  const oasDir = joinPaths(projectRoot, '.oas');

  if (directoryExists(oasDir)) {
    return oasDir;
  }

  // If not found, try to find it relative to the current working directory
  // This is a fallback for unusual project structures
  const cwdOasDir = joinPaths(process.cwd(), '.oas');
  if (directoryExists(cwdOasDir)) {
    return cwdOasDir;
  }

  // Default to the project root path, even if it doesn't exist yet
  return oasDir;
};

export const OAS_DIR = determineOasDir();
