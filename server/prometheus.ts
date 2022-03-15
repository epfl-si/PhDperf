/**
 * Serve things (counters etc.) for Prometheus
 */

import * as prom from 'prom-client'
import { WebApp } from 'meteor/webapp'

const Registry = prom.Registry
const register = new Registry()
prom.collectDefaultMetrics({ register })

export class PrometheusSource {
 /**
  * Serve the /metrics URL on the main Meteor port, from the prom-client node.js library.
  */
  static start() {
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
