// Sampled from https://www.npmjs.com/package/react-formio#event-props

export interface customEvent {
  type: string;  // event type
  component: object;  // triggering component
  data: object;  //data for component
  event: string;  // raw event
}
