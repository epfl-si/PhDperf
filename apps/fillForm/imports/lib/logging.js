const debug = require('debug');

const auditLogConsoleBind = () => {
  const consoleOut = debug('phd-assess:audit-log')
  consoleOut.log = console.log.bind(console)
  return consoleOut
}

export const auditLogConsoleOut = auditLogConsoleBind()
