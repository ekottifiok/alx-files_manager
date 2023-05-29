import { list } from 'mongodb/lib/gridfs/grid_store';

/* eslint-disable no-param-reassign */
export function renameObjectProperty(object, oldProp, newProp) {
  Object.defineProperty(
    object, newProp,
    Object.getOwnPropertyDescriptor(object, oldProp),
  );
  delete object[oldProp];
  return object;
}

export function getListFromObject(list, object) {
  Object.keys(object).forEach((key) => {
    if (list.includes(key)) {
      if (!object[key]) delete object[key];
    } else {
      delete object[key];
    }
  });
  return object;
}

export function getListFromObjectValues(valueList, object) {
  const values = [];
  Object.values(object).forEach((item) => valueList.includes(item) && values.push(item));
  return values;
}

export function removeUndefined(obj) {
  Object.keys(obj).map((key) => (!obj[key] ? delete obj[key] : null));
  return obj;
}

export function renameListObjectProperty(listObject, oldProp, newProp) {
  return listObject.map((item) => renameObjectProperty(item, oldProp, newProp));
}
