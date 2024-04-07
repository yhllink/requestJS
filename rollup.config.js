import path from 'path'
import typescript from 'rollup-plugin-typescript2'
import { deletePathSync } from 'yhl-explorer-js'

import pkg from './package.json'

deletePathSync(pkg.main)
deletePathSync(pkg.module)

const inputPath = path.resolve(__dirname, './src/index.ts')

export default [
  {
    input: inputPath,
    output: [
      { file: pkg.main, format: 'cjs', exports: 'auto' },
      { file: pkg.module, format: 'esm', exports: 'auto' },
    ],
    plugins: [
      typescript({
        verbosity: 0,
        tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
        tsconfigOverride: {
          compilerOptions: { target: 'es5' },
          include: ['src'],
        },
      }),
    ],
  },
]
