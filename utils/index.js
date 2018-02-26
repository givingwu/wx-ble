
/**
  * polyfill
  * Promise.prototype.finally(callback)
  */
if (Promise instanceof Function) {
  Promise.prototype.finally = function (callback) {
    return this.then(
      value => Promise.resolve(callback()).then(() => value),
      reason => Promise.resolve(callback()).then(() => { throw reason })
    )
  }
}


/**
 * @utils
 * @desc type check
 */

export const isString = function (str) {
  return typeof str === 'string'
}

export const isNumber = function (str) {
  return typeof str === 'number'
}

export const isBoolean = function (str) {
  return typeof str === 'boolean'
}

export const isFunction = function (fn) {
  return fn && typeof fn === 'function'
}

export const isObject = function (obj) {
  return obj && typeof obj === 'object'
}

export const isUndefined = function (any) {
  return typeof any === undefined || any === undefined
}

export const isArray = function (arr) {
  return arr && (Array.isArray(arr) || Object.prototype.toString.call(arr) === '[object Array]')
}

export const isNotEmptyObj = function (obj) {
  return isObject(obj) && ((0, Object.keys || Object.getOwnPropertyNames)(obj).length)
}


export const merge = function () {
  return Object.assign(...arguments) || (function (args) {
    target = args[0]

    for (let i = 1, j = args.length; i < j; i++) {
      let source = args[i] || {};

      for (let prop in source) {
        if (source.hasOwnProperty(prop)) {
          let value = source[prop];

          if (value !== undefined) {
            target[prop] = value;
          }
        }
      }
    }

    return target;
  }(arguments))
}


export const when = function (value, fulfilled, rejected) {
  var promise = Promise.resolve(value);

  if (arguments.length < 2) {
    return promise;
  }

  return promise.then(fulfilled, rejected);
}


export function warning(msgOrObj) {
  console.log(msgOrObj)

  console.warn(
    isString(msgOrObj) ? msgOrObj : msgOrObj.errMsg || JSON.stringify(msgOrObj)
  )
}


export function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}


export function hex2ab(str) {
  if (!str) {
    return new ArrayBuffer(0);
  }

  var buffer = new ArrayBuffer(str.length);
  let dataView = new DataView(buffer)

  let pos = 0;
  for (var i = 0, len = str.length; i < len; i += 2) {
    let code = parseInt(str.substr(i, 2), 16)

    dataView.setUint8(pos, code)
    pos++
  }

  return buffer;
}


export function hasSameUUID(arr1, arr2) {
  if (!arr1 || !arr1.length || !arr2 || !arr2.length) throw new Error('Check the paramters pls.')
  let hasSame = false

  for (let i = 0, l = arr1.length; i < l ; i++) {
    if (~arr2.indexOf(arr1[i])) {
      return hasSame = true
    }
  }

  return hasSame
}
