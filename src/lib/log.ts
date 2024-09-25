import { createLogger, format, transports } from 'winston'

import config from './config'

console.log('config:', config())

const rootLogger = createLogger({
  level: config().loglevel,
  defaultMeta: {
    pid: process.pid,
    env: config().env,
  },
  format: format.combine(
    format.metadata(),
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console()
  ],
})

export default rootLogger;
