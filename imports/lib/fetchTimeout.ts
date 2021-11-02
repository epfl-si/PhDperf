import { fetch } from 'meteor/fetch'
import { AbortController, AbortSignal } from 'abort-controller'

export const fetchTimeout = (url: string, ms: number, signal: AbortSignal, options = {}) => {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal, ...options });
  if (signal) signal.addEventListener("abort", () => controller.abort());
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
};
