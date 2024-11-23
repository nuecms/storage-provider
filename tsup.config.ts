import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs', 'esm'], // Output both CommonJS and ESM formats
  entry: ['./src/index.ts', './src/Driver.ts'], // Include both index.ts and Driver.ts as entry points
  dts: true, // Generate type declaration files
  shims: true, // Add necessary shims for Node.js
  skipNodeModulesBundle: true, // Skip bundling of node modules
  clean: true, // Clean the output directory before building
  splitting: true // code splitting
});
