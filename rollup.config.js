const path = require('path')
const typescript = require('rollup-plugin-typescript2')
const pkg = require('./package.json')

module.exports = {
  input: path.resolve(__dirname, './src/index.ts'),
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'esm' },
  ],
  plugins: [
    typescript({
      tsconfig: path.resolve(__dirname, 'tsconfig.json'),
      cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
      tsconfigOverride: {
        compilerOptions: { target: 'es5' },
        include: ['src'],
        exclude: ['test', 'test-dts'],
      },
    }),
  ],
}
