const path = require('path')
const { deletePathSync } = require('yhl-explorer-js')

const pkg = require('./package.json')

deletePathSync(path.resolve(pkg.main, '../utils'))
deletePathSync(path.resolve(pkg.main, '../modules'))

deletePathSync(path.resolve(pkg.module, '../utils'))
deletePathSync(path.resolve(pkg.module, '../modules'))
