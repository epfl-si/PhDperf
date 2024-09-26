import _ from "lodash";

const debug = require('debug')('import/policy')


/*
 * Get keys that are submittable. (aka not disabled)
 */
export function findFieldKeysToSubmit(form: any) {
  let fieldKeys: string[] = [];

  const rootComponents = form.components;

  const searchForFieldKeys = (components: []) => {
    components.forEach((element: any) => {
      if (element.key !== undefined &&
        !element.disabled &&
        element.type !== 'panel') {
        fieldKeys.push(element.key);
      }

      if (element.components !== undefined) {
        searchForFieldKeys(element.components);
      }
    })
  };

  searchForFieldKeys(rootComponents);

  return fieldKeys;
}

/*
 * Limit what can be submitted per step, by reading the provided formIO
 * @param dataToSubmit The raw data coming from the UI
 * @param formIODefinition The formIO for the current task
 * @param additionalIgnores Add key list of data you don't want to submit
 * @param exceptions The ones you whitelist anyway
 * @return the cleanuped data ready to be submitted
 */
export const filterUnsubmittableVars = (dataToSubmit: any, formIODefinition: any, additionalIgnores: string[], exceptions: string[]) => {
  let allowedKeys = findFieldKeysToSubmit(JSON.parse(formIODefinition))
  allowedKeys = allowedKeys.filter(n => !additionalIgnores.includes(n))
  allowedKeys = [...new Set([...allowedKeys ,...exceptions])]

  const dataAllowedToSubmit = _.pick(dataToSubmit, allowedKeys)
  const diff = _.differenceWith(Object.keys(dataToSubmit), allowedKeys, _.isEqual)
  if (diff) {
    debug(`Removed this keys has they are unauthorized to be sent: ${diff}`)
  }

  return dataAllowedToSubmit
}
