/** @module Util */
const Util = {
    /**
     * Check to see if a given object is iterable
     * @param {object} obj
     * @return {boolean}
     */
    isIterable(obj: any): boolean {
        return obj && typeof obj[Symbol.iterator] === 'function'
    },
}

export default Util
