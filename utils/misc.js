export function renameObjectProperty(object, oldProp, newProp) {
  Object.defineProperty(
    object, newProp,
    Object.getOwnPropertyDescriptor(object, oldProp),
  );
  // eslint-disable-next-line no-param-reassign
  delete object[oldProp];
  return object;
}

export function renameListObjectProperty(listObject, oldProp, newProp) {
  return listObject.map((item) => renameObjectProperty(item, oldProp, newProp));
}
