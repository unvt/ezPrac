// libraries
const config = require('config')
const { spawn } = require('child_process')
const byline = require('byline')
const fs = require('fs')
const Queue = require('better-queue')
const pretty = require('prettysize')
const TimeFormat = require('hh-mm-ss')
const { Pool, Query } = require('pg')
const Spinner = require('cli-spinner').Spinner
const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const modify = require('./modify.js')

// config constants
const host = config.get('host')
const port = config.get('port') 
const dbUser = config.get('dbUser')
const dbPassword = config.get('dbPassword')
const relations = config.get('relations')
const defaultDate = new Date(config.get('defaultDate'))
const Z = config.get('Z') //minZoom
const mbtilesDir = config.get('mbtilesDir')
const mbtilesName = config.get('mbtilesName')
const logDir = config.get('logDir')
const propertyBlacklist = config.get('propertyBlacklist')
const spinnerString = config.get('spinnerString')
const fetchSize = config.get('fetchSize')
const wtpsThreshold = config.get('wtpsThreshold')
const monitorPeriod = config.get('monitorPeriod')
const tippecanoePath = config.get('tippecanoePath')

// global configurations
Spinner.setDefaultSpinnerString(spinnerString)
winston.configure({
  level: 'silly',
  format: winston.format.simple(),
  transports: [ 
    new DailyRotateFile({
      filename: `${logDir}/produce-log-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
  ]
})

// global variable
let idle = true
let wtps
let modules = {}
let sar
let pools = {}
let productionSpinner = new Spinner()
let moduleKeysInProgress = []

const isIdle = () => {
  return idle
}

const getScores = async () => {
  return new Promise(async (resolve, reject) => {
   let oldestDate = new Date()
     const path = `${mbtilesDir}/${mbtilesName}.mbtiles`
     let mtime = defaultDate
     let size = 0
     if (fs.existsSync(path)) {
        let stat = fs.statSync(path)
        mtime = stat.mtime
        size = stat.size
     }
     oldestDate = (oldestDate < mtime) ? oldestDate : mtime
     modules[mbtilesName] = {
       mtime: mtime,
       size: size,
       score: 0
       }
    resolve()
  })
}

const iso = () => {
  return (new Date()).toISOString()
}

const noPressureWrite = (downstream, f) => {
  return new Promise((res) => {
    if (downstream.write(`\x1e${JSON.stringify(f)}\n`)) {
      res()
    } else {
      downstream.once('drain', () => { 
        res()
      })
    }
  })
}

const fetch = (client, database, table, downstream) => {
  return new Promise((resolve, reject) => {
    let count = 0
    let features = []
    client.query(new Query(`FETCH ${fetchSize} FROM cur`))
    .on('row', row => {
      let f = {
        type: 'Feature',
        properties: row,
        geometry: JSON.parse(row.st_asgeojson)
      }
      delete f.properties.st_asgeojson
      f.properties._database = database
      f.properties._table = table
      count++
      f = modify(f)
      if (f) features.push(f)
    })
    .on('error', err => {
      console.error(err.stack)
      reject()
    })
    .on('end', async () => {
      for (f of features) {
        try {
          await noPressureWrite(downstream, f)
        } catch (e) {
          reject(e)
        }
      }
      resolve(count)
    })
  })
}

const dumpAndModify = async (relation, downstream, mbtilesName) => {
  return new Promise((resolve, reject) => {
    const startTime = new Date()
    const [database, schema, table] = relation.split('::')
    if (!pools[database]) {
      pools[database] = new Pool({
        host: host,
        user: dbUser,
        port: port,
        password: dbPassword,
        database: database
      })
    }
    pools[database].connect(async (err, client, release) => {
      if (err) throw err
      let sql = `
SELECT column_name FROM information_schema.columns 
  WHERE table_name='${table}' AND table_schema='${schema}' ORDER BY ordinal_position`
      let cols = await client.query(sql)
      cols = cols.rows.map(r => r.column_name).filter(r => r !== 'geom')
      cols = cols.filter(v => !propertyBlacklist.includes(v))
      cols.push(`ST_AsGeoJSON(${schema}.${table}.geom)`)
      await client.query(`BEGIN`)
      sql = `
DECLARE cur CURSOR FOR 
SELECT 
  ${cols.toString()}
FROM ${schema}.${table}
` 
      cols = await client.query(sql)
      try {
        while (await fetch(client, database, table, downstream) !== 0) {}
      } catch (e) {
        reject(e)
      }
      await client.query(`COMMIT`)
      winston.info(`${iso()}: finished ${relation} of ${mbtilesName}`)
      release()
      resolve()
    })
  })
}

const sleep = (wait) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, wait)
  })
}

const queue = new Queue(async (t, cb) => {
  const startTime = new Date()
  const moduleKey = t.moduleKey
  const queueStats = queue.getStats()
  const [z, x, y] = moduleKey.split('-').map(v => Number(v))
  const tmpPath = `${mbtilesDir}/part-${mbtilesName}.mbtiles`
  const dstPath = `${mbtilesDir}/${mbtilesName}.mbtiles`

  moduleKeysInProgress.push(mbtilesName)
  productionSpinner.setSpinnerTitle(moduleKeysInProgress.join(', '))

  const tippecanoe = spawn(tippecanoePath, [
    '--quiet',
    '--no-feature-limit',
    '--no-tile-size-limit',
    '--force',
    '--simplification=2',
    '--drop-rate=1',
    `--minimum-zoom=${Z}`,
    '--maximum-zoom=5',
    '--base-zoom=5',
    '--hilbert',
    `--output=${tmpPath}`
  ], { stdio: ['pipe', 'inherit', 'inherit'] })
  tippecanoe.on('exit', () => {
    fs.renameSync(tmpPath, dstPath)
    moduleKeysInProgress = moduleKeysInProgress.filter((v) => !(v === moduleKey))
    productionSpinner.stop()
    process.stdout.write('\n')
    const logString = `${iso()}: [${queueStats.total + 1}/${queueStats.peak}] process ${mbtilesName} (score: ${modules[mbtilesName].score}, ${pretty(modules[mbtilesName].size)} => ${pretty(fs.statSync(dstPath).size)}) took ${TimeFormat.fromMs(new Date() - startTime)} wtps=${wtps}.`
    winston.info(logString)
    console.log(logString)
    if (moduleKeysInProgress.length !== 0) {
      productionSpinner.setSpinnerTitle(moduleKeysInProgress.join(', '))
      productionSpinner.start()
    }
    return cb()
  })

  productionSpinner.start()
  for (relation of relations) {
    while (!isIdle()) {
      winston.info(`${iso()}: short break due to heavy disk writes (wtps=${wtps}).`)
      await sleep(5000)
    }
    try {
      await dumpAndModify(relation, tippecanoe.stdin, mbtilesName)
    } catch (e) {
      winston.error(e)
      cb(true)
    }
  }
  tippecanoe.stdin.end()
}, { 
  concurrent: config.get('concurrentS'), 
  maxRetries: config.get('maxRetries'),
  retryDelay: config.get('retryDelay') 
})

const queueTasks = () => {
  let moduleKeys = Object.keys(modules)
      queue.push({
        moduleKey: mbtilesName
      })
}

// shutdown this system
const shutdown = () => {
  winston.info(`${iso()}: Production system shutdown.`)
  console.log('** Production system shutdown! **')
  process.exit(0)
}

const main = async () => {
  winston.info(`${iso()}: Production started.`)
  console.log(`${iso()}: Hello. Production has started.`)
  await getScores()  //get size, mtime, etc of modules[mbtilesName] 
  queueTasks() //pushing moduleKey to queue. Here we do not have more than one moduleKey
  queue.on('drain', () => {
    shutdown()
  })
}

main()
