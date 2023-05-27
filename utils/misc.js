export function renameObjectProperty(object, oldProp, newProp) {
  Object.defineProperty(
    object, newProp,
    Object.getOwnPropertyDescriptor(object, oldProp),
  );
  // eslint-disable-next-line no-param-reassign
  delete object[oldProp];
  return object;
}

export function getListFromObject(list, object) {
  // eslint-disable-next-line no-param-reassign
  Object.keys(object).forEach((key) => (list.includes(key) ? null : delete object[key]));
  return object;
}

export function renameListObjectProperty(listObject, oldProp, newProp) {
  return listObject.map((item) => renameObjectProperty(item, oldProp, newProp));
}
