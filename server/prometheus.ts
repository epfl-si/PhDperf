/**
 * Serve things (counters etc.) for Prometheus
 */

import * as prom from 'prom-client'
import { WebApp } from 'meteor/webapp'

const Registry = prom.Registry
const register = new Registry()
prom.collectDefaultMetrics({ register })

export const PrometheusSource = {
 /**
  * Serve the /metrics URL on the main Meteor port, from the prom-client node.js library.
  */
  start() {
    WebApp.connectHandlers.use('/metrics', async (_req, res) => {
      const metrics = await register.metrics();
      const length = Buffer.byteLength(metrics, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/plain; version=0.0.4',
        'Content-Length': length,
      });
      res.end(metrics);
    });
  }
}

function newCounter(opts: ConstructorParameters<typeof prom.Counter>[0]) {
  const counter = new prom.Counter(opts)
  register.registerMetric(counter)
  return counter
}

const zeebeMetrics = {
  received: newCounter({
    name: 'phdassess_zeebe_broker_connector_received',
    help: 'Number of times the Zeebe broker connector received a task from Zeebe'
  }),
  alreadyIn: newCounter({
    name: 'phdassess_zeebe_broker_connector_task_already_in',
    help: 'Number of times a task has been received from Zeebe, but ignored because it was already in DB'
  }),
  inserted: newCounter({
    name: 'phdassess_zeebe_broker_connector_task_inserted',
    help: 'Number of times a new task has been inserted, as a result of receiving a task from Zeebe'
  }),
  errors: newCounter({
    name: 'phdassess_zeebe_broker_connector_errors',
    help: 'Number of times the Zeebe broker connector found an error for any reason (incl. decryption failed)'
  }),
  successes: newCounter({
    name: 'phdassess_zeebe_broker_connector_successes',
    help: 'Number of times the Zeebe broker connector sent a Success outcome for a Zeebe workflow instance'
  })
}

function measureFacet<T extends string>(metrics: {[key: string] : prom.Counter<T> }) {
  return Object.fromEntries(Object.entries(metrics).map(
    ([key, value]) => [key, { inc: value.inc.bind(value) }]))
}

export const Metrics = {
  zeebe: measureFacet(zeebeMetrics)
}
