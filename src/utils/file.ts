import fs from 'node:fs';
import path from 'node:path';
import { StackOneError } from '../tools';

/**
 * Utilities for handling file operations
 */

/**
 * Check if a string is base64 encoded
 */
export function isBase64(str: string): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  // Check if it's a data URL
  if (str.startsWith('data:')) {
    return true;
  }

  // Check if it's a base64 string
  try {
    // Regular expression for base64 format
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return base64Regex.test(str);
  } catch (_e) {
    return false;
  }
}

/**
 * Check if value is a valid file path and the file exists
 */
export function isValidFilePath(filePath: string): boolean {
  if (typeof filePath !== 'string' || filePath.startsWith('data:') || isBase64(filePath)) {
    return false;
  }

  // Check if the file exists
  return fs.existsSync(filePath);
}

/**
 * Read a file and return its contents as a base64 string
 */
export function readFileAsBase64(filePath: string): string {
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    throw new StackOneError(`File not found: ${filePath}`);
  }

  // Read the file and convert to base64
  const fileContent = fs.readFileSync(filePath);
  return fileContent.toString('base64');
}

/**
 * Extract information from a file path
 */
export function extractFileInfo(filePath: string): {
  fileName: string;
  extension: string | null;
} {
  // Extract filename from the file path
  const fileName = path.basename(filePath);

  // Extract file extension if it exists
  let extension = null;
  if (fileName.includes('.')) {
    extension = fileName.split('.').pop()?.toLowerCase() || null;
  }

  return { fileName, extension };
}

/**
 * Check if a directory exists
 */
export function directoryExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (_e) {
    return false;
  }
}

/**
 * List all files in a directory with an optional filter
 */
export function listFilesInDirectory(
  dirPath: string,
  filter?: (fileName: string) => boolean
): string[] {
  if (!directoryExists(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  return filter ? files.filter(filter) : files;
}

/**
 * Read and parse a JSON file
 */
export function readJsonFile<T>(filePath: string): T {
  if (!isValidFilePath(filePath)) {
    throw new StackOneError(`JSON file not found: ${filePath}`);
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    throw new StackOneError(
      `Error parsing JSON file: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get the file name without extension
 */
export function getFileNameWithoutExtension(filePath: string): string {
  const fileName = path.basename(filePath);
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? fileName : fileName.substring(0, dotIndex);
}

/**
 * Join path segments safely
 */
export function joinPaths(...segments: string[]): string {
  return path.join(...segments);
}
