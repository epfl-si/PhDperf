export function findDisabledFields(form: any) {
  let disabledFieldKeys: string[] = [];

  const rootComponents = form.components;

  const searchForDisabledFields = (components: []) => {
    components.forEach((element: any) => {
      if (element.key !== undefined &&
        element.disabled !== undefined &&
        element.disabled) {
        disabledFieldKeys.push(element.key);
      }

      if (element.components !== undefined) {
        searchForDisabledFields(element.components);
      }
    })
  };

  searchForDisabledFields(rootComponents);

  return disabledFieldKeys;
}

/*
 * Get keys that are submittable:
 * - not disable
 */
export function findFieldKeysToSubmit(form: any) {
  let fieldKeys: string[] = [];

  const rootComponents = form.components;

  const searchForFieldKeys = (components: []) => {
    components.forEach((element: any) => {
      if (element.key !== undefined &&
        !element.disabled) {
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
