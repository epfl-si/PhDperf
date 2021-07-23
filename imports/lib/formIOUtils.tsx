export default function findDisabledFields(form: any) {
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
