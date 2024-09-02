import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import typescript from 'rollup-plugin-typescript2'
import { deletePathSync } from 'yhl-explorer-js'

import pkg from './package.json' assert { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

deletePathSync(path.resolve(pkg.main, '../'))
deletePathSync(path.resolve(pkg.module, '../'))

export default [
  {
    input: path.resolve(__dirname, './src/index.ts'),
    output: [
      {
        dir: path.resolve(pkg.main, '../'),
        format: 'cjs',
        splitChunks: true,
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js',
      },
      {
        dir: path.resolve(pkg.module, '../'),
        format: 'esm',
        splitChunks: true,
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js',
      },
    ],
    plugins: [
      typescript({
        declaration: true,
        cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
        tsconfigOverride: { compilerOptions: { target: 'es5' }, include: ['src'] },
      }),
    ],
  },
]
