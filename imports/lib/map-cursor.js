/**
 * @constructor
 */
export function MapCursor(cursor, transform, targetCollection) {
  function pumpTo(sub) {
    const observeHandle = cursor.observeChanges({
      async added (id, fields) {
        sub.added(targetCollection, id, await transform(fields, id))
      },
      async changed (id, fields) {
        sub.changed(targetCollection, id, await transform(fields, id))
      },
      removed (id) {
        sub.removed(targetCollection, id)
      }
    })
    sub.onStop(function () { observeHandle.stop() })
    return observeHandle
  }

  return {
    start: (sub) => pumpTo(sub),
    // This makes it so that you can simply return the MapCursor object from
    // a Meteor publish function:
    _publishCursor: (sub) => pumpTo(sub)
  }
}
