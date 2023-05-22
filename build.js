const fs = require('fs')

const PackageLock = JSON.parse(fs.readFileSync('./package-lock.json', 'utf-8'))
const Package = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

Package.main = 'main.js'

fs.writeFileSync('./build/package-lock.json', JSON.stringify(PackageLock))
fs.writeFileSync('./build/package.json', JSON.stringify(Package))
fs.cpSync('./src/assets/config.example.toml', './build/assets/config.example.toml')
