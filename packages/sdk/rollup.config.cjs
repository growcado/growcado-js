const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx(
  {
    main: './src/index.ts',
    outputPath: './dist',
    tsConfig: './tsconfig.lib.json',
    compiler: 'tsc',
    format: ['esm', 'cjs'],
    sourcemap: true,
    // External dependencies - don't bundle these
    external: ['tslib'],
    assets: [{ input: '.', output: '.', glob: 'README.md' }],
  },
  {
    // Additional rollup configuration
    output: {
      // Generate proper sourcemaps
      sourcemap: true,
      // Use proper banner for SDK library
      banner: '/* Growcado SDK - https://growcado.io */',
    },
  }
); 