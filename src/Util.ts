/**
 * Check to see if a given object is iterable
 * @param {object} obj
 * @return {boolean}
 */
export function isIterable(obj: any): boolean {
    return obj && typeof obj[Symbol.iterator] === 'function';
}
