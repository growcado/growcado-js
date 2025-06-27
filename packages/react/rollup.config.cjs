const { withNx } = require('@nx/rollup/with-nx');

module.exports = withNx(
  {
    main: './src/index.ts',
    outputPath: './dist',
    tsConfig: './tsconfig.lib.json',
    compiler: 'babel',
    format: ['esm'],
    sourcemap: true,
    // External dependencies - don't bundle these
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tanstack/react-query',
      '@growcado/sdk'
    ],
    assets: [{ input: '.', output: '.', glob: 'README.md' }],
  },
  {
    // Additional rollup configuration
    output: {
      // Generate proper sourcemaps
      sourcemap: true,
      // Use proper banner for React library
      banner: '/* Growcado React SDK - https://growcado.com */',
    },
  }
);
