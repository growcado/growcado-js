const { withNx } = require('@nx/rollup/with-nx');
const url = require('@rollup/plugin-url');
const svg = require('@svgr/rollup');
const alias = require('@rollup/plugin-alias');
const path = require('path');

module.exports = withNx(
  {
    main: './src/index.ts',
    outputPath: '../../dist/packages/react',
    tsConfig: './tsconfig.lib.json',
    compiler: 'babel',
    external: ['react', 'react-dom', 'react/jsx-runtime', '@growcado/sdk'],
    format: ['esm'],
    assets: [{ input: '.', output: '.', glob: 'README.md' }],
  },
  {
    // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
    plugins: [
      alias({
        entries: [
          { find: '@growcado/sdk', replacement: path.resolve(__dirname, '../sdk/src/index.ts') }
        ]
      }),
      svg({
        svgo: false,
        titleProp: true,
        ref: true,
      }),
      url({
        limit: 10000, // 10kB
      }),
    ],
  }
);
