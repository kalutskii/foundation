import { defineConfig } from 'tsdown';

// Tsdown configuration for building the package.
// More details: https://tsdown.dev/options;

const tsdownConfig = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'esnext',

  dts: true, // Generates TypeScript declaration files
  clean: true, // Clean output directory before each build
  unbundle: false, // Bundle all dependencies into the output files
  fixedExtension: false, // Preserve package-compatible `.js` and `.d.ts` extensions
});

export default tsdownConfig;
