const config = require('config')
const Parser = require('json-text-sequence').parser
const { spawn } = require('child_process')

const minzoom = config.get('minzoom')
const maxzoom = config.get('maxzoom')
const srcs = config.get('srcs')
const ogr2ogrPath = config.get('ogr2ogrPath')
const tippecanoePath = config.get('tippecanoePath')
const dstDir = config.get('dstDir')

const tippecanoe = spawn(tippecanoePath, [
  `--output-to-directory=${dstDir}`,
  `--no-tile-compression`,
  `--drop-rate=1`,
  '--force',
  `--minimum-zoom=${minzoom}`,
  `--maximum-zoom=${maxzoom}`
], { stdio: ['pipe', 'inherit', 'inherit'] })

const downstream = tippecanoe.stdin //for tippecanoe
//const downstream = process.stdout //for standard out

const renameProperties = (f) => { // Actually, I do nothing here. this part is for future use.
  for (let pair of [
    ['ISO3CD', '3CD'],
    ['ISOADM', 'ADM'],
    ['MAPLAB', 'LAB'],
  ]) {
    if (f.properties[pair[0]]) {
      f.properties[pair[1]] = f.properties[pair[0]]
      delete f.properties[pair[1]]  //Here if you want to change, delete f.properties[pair[0]]
    }
  }
  return f
}

let nOpenFiles = 0
for (const src of srcs) {
  nOpenFiles++
  const parser = new Parser()
    .on('data', f => {
      f = renameProperties(f)
      f.tippecanoe = {
        layer: src.layer,
        minzoom: src.minzoom,
        maxzoom: src.maxzoom
      }
      downstream.write(`\x1e${JSON.stringify(f)}\n`)
    })
    .on('finish', () => {
      nOpenFiles--
      if (nOpenFiles === 0) {
        downstream.end()
      }
    })
  const ogr2ogr = spawn(ogr2ogrPath, [
    '-f', 'GeoJSONSeq',
    '-lco', 'RS=YES',
    '/vsistdout/',
    src.url
  ])
  ogr2ogr.stdout.pipe(parser)
}
