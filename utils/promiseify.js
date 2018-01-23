
import { merge, isArray, isString, isObject, isFunction, isUndefined } from 'index'

const BLUETOOTH_METHODS = ["openBluetoothAdapter", "closeBluetoothAdapter", "getBluetoothAdapterState", "startBluetoothDevicesDiscovery", "stopBluetoothDevicesDiscovery", "getBluetoothDevices", "getConnectedBluetoothDevices", "createBLEConnection", "closeBLEConnection", "getBLEDeviceServices", "getBLEDeviceCharacteristics",
  /**
   * @desc  读取低功耗蓝牙设备的特征值的二进制数据值。注意：必须设备的特征值支持read才可以成功调用，具体参照 characteristic 的 properties 属性
   */
  "readBLECharacteristicValue",

  /**
   * @desc  向低功耗蓝牙设备特征值中写入二进制数据。注意：必须设备的特征值支持write才可以成功调用，具体参照 characteristic 的 properties 属性
   * @note  必须先启用notify才能监听到设备 characteristicValueChange 事件
   */
  "writeBLECharacteristicValue",

  /**
   * @desc  启用低功耗蓝牙设备特征值变化时的 notify 功能，订阅特征值。注意：必须设备的特征值支持notify或者indicate才可以成功调用
   */
  "notifyBLECharacteristicValueChange",

  /**
   * @desc  监听寻找到新设备的事件
   * @param   {Function}    CALLBACK
   *  @property {Array}   devices		      新搜索到的设备列表
   */
  "onBluetoothDeviceFound",

  /**
   * @desc  监听蓝牙适配器状态变化事件
   * @param   {Function}    CALLBACK
   *  @property {Boolean}   available		  蓝牙适配器是否可用
   *  @property {Boolean}   discovering 	蓝牙适配器是否处于搜索状态
   */
  "onBluetoothAdapterStateChange",

  /**
   * @desc 监听低功耗蓝牙连接的错误事件，包括设备丢失，连接异常断开等等。
   * @param   {Function}    CALLBACK
   *  @property {String}    deviceId      蓝牙设备 id，参考 device 对象
   *  @property {Boolean}   connected     连接目前的状态
   */
  "onBLEConnectionStateChange",

  /**
   * @desc 监听低功耗蓝牙设备的特征值变化。必须先启用notify接口才能接收到设备推送的notification。
   * @param   {Function}    CALLBACK
   *  @property {String}    deviceId		  蓝牙设备 id，参考 device 对象
   *  @property {String}    serviceId   	特征值所属服务 uuid
   *  @property {String}    characteristicId		特征值 uuid
   *  @property {ArrayBuffer} value		    特征值最新的值 （注意：vConsole 无法打印出 ArrayBuffer 类型数据）
   */
  "onBLECharacteristicValueChange"
]
const BLUETOOTH_METHODS_CB = ["onBluetoothDeviceFound", "onBluetoothAdapterStateChange", "onBLEConnectionStateChange", "onBLECharacteristicValueChange"]
const ERROR_MESSAFES = {
  10000: 'not init	未初始化蓝牙适配器',
  10001: 'not available	当前蓝牙适配器不可用',
  10002: 'no device	没有找到指定设备',
  10003: 'connection fail	连接失败',
  10004: 'no service	没有找到指定服务',
  10005: 'no characteristic	没有找到指定特征值',
  10006: 'no connection	当前连接已断开',
  10007: 'property not support	当前特征值不支持此操作',
  10008: 'system error	其余所有系统上报的异常',
  10009: 'system not support	Android 系统特有，系统版本低于 4.3 不支持BLE'
}

const validOptions = function (options) {
  const keys = Object.keys(options)

  keys.splice(keys.indexOf('success'), 1)
  keys.splice(keys.indexOf('fail'), 1)

  return keys.length
}

export default function installPromiseify () {
  BLUETOOTH_METHODS.forEach(method => {
    const canUse = wx.canIUse(method)
    const promiseProxyWrapper = function () {
      const self = this

      return new Promise((reslove, reject) => {
        if (canUse) {
          let options = {
            success() {
              self.config.debug && console.log('W-BLE:into request method: ', method)
              self.config.debug && validOptions(options) && console.log('W-BLE:options: ', options)
              self.config.debug && console.log('W-BLE:response: ', arguments.length >= 2 ? arguments : arguments[0])

              reslove(arguments.length >= 2 ? arguments : arguments[0])
            },
            fail(error) {
              self.config.debug && console.log('W-BLE:into fail control catch -> wx.' + method)

              if (error && !isUndefined(error.errCode) && +error.errCode !== 0) {
                return reject(error.errMsg + ' - ' + ERROR_MESSAFES[error.errCode])
              }

              return reject(arguments.length >= 2 ? arguments : arguments[0])
            }
          }

          Array.from(arguments).forEach(param => isObject(param) && merge(options, param))
          wx[method].apply(wx, arguments.length >= 2 ? arguments : [options])

        } else {
          reject(`W-BLE:'wx.${method}' may not be supperted on current execution context!`)
        }
      })
    }

    if (!~BLUETOOTH_METHODS_CB.indexOf(method)) {
      this[method] = function () {
        return promiseProxyWrapper.call(this, ...arguments)
      }
    } else {
      this[method] = function () {
        this.config.debug && console.log(`W-BLE:'wx.${method}' be called.`)

        if (canUse) {
          return wx[method].apply(this, arguments)
        } else {
          return console.warn(`W-BLE:'wx.${method}' may not be supperted on current execution context!`)
        }
      }
    }
  })
}
