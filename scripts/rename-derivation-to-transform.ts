#!/usr/bin/env bun

/**
 * Script to rename derivation terminology to parameter transformation terminology
 * 
 * This script will:
 * 1. Rename DerivationConfig to ParameterTransformer
 * 2. Rename derivationFunctions to transforms
 * 3. Rename deriveParameters to transformParameter
 * 4. Rename derivationConfigs to transformers
 * 5. Update all related variable names and comments
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Define the replacements
const replacements = [
  // Type and interface names
  { from: /DerivationConfig/g, to: 'ParameterTransformer' },
  { from: /DerivationFunction/g, to: 'TransformFunction' },
  { from: /DerivationFunctions/g, to: 'TransformFunctions' },
  { from: /DerivationConfigMap/g, to: 'ParameterTransformerMap' },
  
  // Property and method names
  { from: /derivationFunctions/g, to: 'transforms' },
  { from: /derivationConfigs/g, to: 'transformers' },
  { from: /derivationConfig/g, to: 'transformer' },
  { from: /deriveParameters/g, to: 'transformParameter' },
  { from: /addDerivationConfig/g, to: 'addTransformer' },
  { from: /getDerivationConfig/g, to: 'getTransformer' },
  { from: /getDefaultDerivationConfigs/g, to: 'getDefaultTransformers' },
  
  // Variable names
  { from: /sourceParameter/g, to: 'sourceParameter' }, // Keep this the same
  
  // Comments and documentation
  { from: /parameter derivation/g, to: 'parameter transformation' },
  { from: /Parameter Derivation/g, to: 'Parameter Transformation' },
  { from: /derived parameter/g, to: 'transformed parameter' },
  { from: /derive parameter/g, to: 'transform parameter' },
  { from: /Derive parameter/g, to: 'Transform parameter' },
];

// Get all TypeScript files in the src directory
const getAllTsFiles = (dir: string): string[] => {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

// Process a file with the replacements
const processFile = (filePath: string): void => {
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  
  for (const replacement of replacements) {
    const newContent = content.replace(replacement.from, replacement.to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
};

// Main function
const main = (): void => {
  // Process src directory
  const srcFiles = getAllTsFiles(path.join(process.cwd(), 'src'));
  for (const file of srcFiles) {
    processFile(file);
  }
  
  // Process examples directory
  const examplesFiles = getAllTsFiles(path.join(process.cwd(), 'examples'));
  for (const file of examplesFiles) {
    processFile(file);
  }
  
  // Run tests to verify everything still works
  console.log('\nRunning tests to verify changes...');
  try {
    execSync('bun test', { stdio: 'inherit' });
    console.log('\nAll tests passed! The renaming was successful.');
  } catch (error) {
    console.error('\nTests failed after renaming. Please check the errors above.');
    process.exit(1);
  }
};

// Run the script
main(); 