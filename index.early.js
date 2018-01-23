/**
 * References:
 *  1. https://www.cnblogs.com/qcloud1001/p/7717860.html
 *  2. http://www.ifanr.com/minapp/907329
 *
 * 1. 搜索类
 *  1.1 获取本机蓝牙适配器状态蓝牙适配器是否可用 openBlueDeivceAdapter -> getBluetoothAdapterState -> onBluetoothAdapterStateChange -> 1.1.1
 *                                                              -> onBluetoothAdapterStateChange
 *    1.1.1 已开启搜索 getConnenctedBluetoothDevices -> step 1.1.3
 *    1.1.2 未开启搜索 startBluetoothDevicesDiscovery -> onBluetoothDeviceFound -> step 1.1.3
 *    1.1.3 是否存在存在指定的bluetooth信息
 *      1.1.3.1 Y 通知用户已搜索到指定蓝牙 -> step 2.
 *      1.1.3.2 N 不存在指定的bluetooth信息 -> keep searching
 *
 * 2. 连接类
 *  2.1 是否已连接指定蓝牙 -> getConnectedBluetoothDevices
 *    2.1.1  Y getBLEDeviceServices -> getBLEDeviceCharacteristics -> 3
 *    2.1.2  N createBLEConnection -> onBLEConnectionStateChange
 *      PS: 建议双平台统一在建立链接后先执行 getBLEDeviceServices 与 getBLEDeviceCharacteristics 后再进行与蓝牙的数据交互
 *      2.1.2.1 Y - connected - stopBluetoothDevicesDiscovery - to step 3
 *      2.1.2.2 N - to step 2
 *      PS: 若小程序在之前已有搜索过某个蓝牙，并成功建立链接，可直接传入之前搜索获取的deviceId直接尝试连接该设备，无需进行搜索操作。
 *      PS: 保证尽量成对的调用create和close接口，返回10006错误，建议进行重连操作
 *    2.1.3
 * 3. 通信类
 *  3.1 readBLECharacteristicValue
 *  3.2 writeBLECharacteristicValue
 *  3.3 notifyBLECharacteristicValueChange
 * 4. 完成后
 *  4.1 closeBLEConnection
 *  4.2 closeBluetoothAdapter
 */
import { merge, isArray, isString, isObject, isFunction, isUndefined, isNotEmptyObj } from '../util'


const Bluetooth = {}
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
const DEFAULTS_OPTIONS = {
  timeout: 5000,
  keepAlive: false,
  maxRetryTimes: 5,
  autoReconnect: true,

  services: [],
  interval: 0,
  allowDuplicatesKey: false
}


BLUETOOTH_METHODS.forEach(method => {
  const canUse = wx.canIUse(method)
  const promiseProxyWrapper = function () {
    return new Promise((reslove, reject) => {
      if (canUse) {
        let options = {
          success() {
            console.log('invoked Bluetooth.' + method, '\noptions', options, '\nresponse', arguments.length >= 2 ? arguments : arguments[0])
            reslove(arguments.length >= 2 ? arguments : arguments[0])
          },
          fail(error) {
            let response = arguments.length === 1 && isObject(arguments[0]) && arguments[0]

            if (response && !isUndefined(response.errCode) && +response.errCode !== 0) {
              return reject(response.errMsg + ' - ' + ERROR_MESSAFES[response.errCode])
            }

            console.log(' into fail control function -> Bluetooth.' + method)
            reject(arguments.length >= 2 ? arguments : arguments[0])
          }
        }

        Array.from(arguments).forEach(param => isObject(param) && merge(options, param))
        wx[method].apply(wx, arguments.length >= 2 ? arguments : [options])
      } else {
        reject(`'wx.${method}' may not be supperted on current execution context!`)
      }
    })
  }

  if (!~BLUETOOTH_METHODS_CB.indexOf(method)) {
    Bluetooth[method] = function () {
      return promiseProxyWrapper.call(this, ...arguments)
    }
  } else {
    Bluetooth[method] = function () {
      if (canUse) {
        return wx[method].apply(this, arguments)
      } else {
        return console.warn(`'wx.${method}' may not be supperted on current execution context!`)
      }
    }
  }
})


merge(Bluetooth, {
  configOptions: DEFAULTS_OPTIONS,

  _openedAdapter: false,
  _discovering: false,
  _device: null,
  _connected: false,
  _serviceId: null,

  _characteristics: null,
  _characteristic: {
    readId: null,
    writeId: null,
    notifyId: null
  },
  _closeBySelf: null,

  _openBluetoothAdapter() {
    wx.showToast({ title: '初始化适配器', duration: 2000 })

    this.openBluetoothAdapter().then(res => {
      wx.showToast({ title: '蓝牙初始化成功', duration: 2000 })

      this._openedAdapter = true
      this.onBluetoothAdapterStateChange(this._onBluetoothAdapterStateChange.bind(this))
      this._getBluetoothAdapterState()
    }).catch(error => {
      warning(error)
      wx.hideToast()
      wx.showModal({ title: '蓝牙初始化失败', content: '请在设备设置中打开蓝牙开关', showCancel: false })
    })
  },

  _onBluetoothAdapterStateChange(res) {
    console.log(`adapterState changed, now is`, res)
    const { available, discovering } = res

    if (!available) {
      if (!this._openedAdapter) this._openBluetoothAdapter()

      wx.hideLoading()
      wx.showModal({ title: '无法开启蓝牙连接', content: '请检查设备蓝牙连接是否正常', showCancel: false })
      // throw new Error('The Bluetooth adapter is not available now!')
    } else {
      if (discovering) {
        this._discovering = true
        // this._getBluetoothDevices && this._getBluetoothDevices()
      } else {
        this._discovering = false
        this.connenct()
      }
    }
  },

  _getBluetoothAdapterState() {

    this.getBluetoothAdapterState()
      .then(this._onBluetoothAdapterStateChange.bind(this))
      .catch(warning)

  },

  _getConnectedBluetoothDevices() {

    this.getConnectedBluetoothDevices(this.configOptions)
      .then(res => {
        const { devices } = res

        if (devices && devices.length) {
          this._checkDevicesWhetherMatch(devices)
        }
      })
      .catch(error => {
        warning(error)
        this.configOptions.autoReconnect && this.configOptions.maxRetryTimes-- ? this._getConnectedBluetoothDevices() : this._closeBluetoothAdapter()
      })

  },

  _startBluetoothDevicesDiscovery() {
    wx.showLoading({ title: '搜索蓝牙中...' })

    this.startBluetoothDevicesDiscovery(this.configOptions)
      .then(res => res.isDiscovering
        ? this.onBluetoothDeviceFound(res => {
          // 开发者工具和 Android 上获取到的deviceId为设备 MAC 地址，iOS 上则为设备 uuid。因此deviceId不能硬编码到代码中
          const { devices } = res

          if (devices && devices.length) {
            this._checkDevicesWhetherMatch(devices)
          }
        })
        : this._getBluetoothAdapterState())
      .catch(error => {
        warning(error)
        this.configOptions.autoReconnect && this.configOptions.maxRetryTimes-- ? this._startBluetoothDevicesDiscovery() : this._closeBluetoothAdapter()
      })

  },

  _checkDevicesWhetherMatch(devices) {

    const self = this, { deviceName, services, characteristicId } = this.configOptions
    let matched = false

    for (let i = 0, l = devices.length; i < l; i++) {
      devices[i].advertisData && console.log(ab2hex(devices[i].advertisData))

      if (devices[i].name === deviceName || devices[i].localName === deviceName) {
        this._device = devices[i]
        matched = true

        break
      }
    }

    if (matched) {
      wx.showToast({
        title: '已找到目标设备',
        duration: 2000,
        complete() {
          self._discovering && self.stopBluetoothDevicesDiscovery().catch(warning)
        }
      })
    }
  },

  _createBLEConnection() {

    this.createBLEConnection({ deviceId: this._device.deviceId })
      .then(_ => this._connected = true, wx.showToast({ title: '连接设备成功', duration: 2000 }))
      .then(this.onBLEConnectionStateChange(this._onBLEConnectionStateChange.bind(this)))
      .catch(error => {
        warning(error)
        this.configOptions.autoReconnect && this.configOptions.maxRetryTimes-- ? this.connenct() : this._closeBluetoothAdapter()
      })

  },

  _onBLEConnectionStateChange(res) {
    if (this._closeBySelf) return this._closeBySelf = null
    const { connected, deviceId } = res, self = this

    if (connected) {
      this._connected = true
      this._getBLEDeviceServices.call(this)
    } else {
      this._connected = false

      wx.showModal({
        title: '蓝牙连接中断',
        content: '连接异常断开，设备将自动重新链接',
        showCancel: false,
        success() {
          wx.showToast({ title: '自动重连中', icon: 'loading' })
          self.connenct()
        }
      })
    }
  },

  _getBLEDeviceServices() {
    if (this._serviceId) {
      this._getBLEDeviceCharacteristics()
    } else {
      this.getBLEDeviceServices({ deviceId: this._device.deviceId })
        // this lost? WTF?!!
        .then(this._checkDeviceServices.bind(this))
        .then(this._getBLEDeviceCharacteristics.bind(this))
        .catch(error => {
          console.log(' into _getBLEDeviceServices catch', error)
          warning(error)
          this.configOptions.autoReconnect && --this.configOptions.maxRetryTimes ? this.connenct() : this._closeBluetoothAdapter()
          console.log(this.configOptions.autoReconnect, this.configOptions.maxRetryTimes)
        })
    }
  },

  _checkDeviceServices(res) {
    const { services } = res
    let isValid = false

    for (let i = 0, l = services.length; i < l; i++) {
      const { uuid, isPrimary } = services[i]

      if (~this.configOptions.services.indexOf(services[i].uuid)) {
        this._serviceId = uuid
        isValid = true

        break
      }
    }

    // /**
    if (!isValid) throw new Error(' Cannot got a valid serviceId on this device ' + this.deviceId)
    else return isValid
    // */
  },

  _getBLEDeviceCharacteristics(res) {

    this.getBLEDeviceCharacteristics({ deviceId: this._device.deviceId, serviceId: this._serviceId })
      .then(this._checkDeviceCharacteristics.bind(this))
      .then(isValid => {
        isValid && this.notifyBLECharacteristicValueChange({
          deviceId: this._device.deviceId,
          serviceId: this._serviceId,
          characteristicId: this._characteristic.notifyId,
          state: true
        }).then(_ => {
          setTimeout(_ => {
            const { onConnect } = this.configOptions
            this.onBLECharacteristicValueChange(this._onBLECharacteristicValueChange.bind(this))

            onConnect && isFunction(onConnect) && onConnect()
          }, 2000)
        }).catch(warning)
      })
      .catch(error => {
        console.log(' into this._getBLEDeviceCharacteristics catch ', error)
        warning(error)
        // this.configOptions.autoReconnect && this.configOptions.maxRetryTimes-- ? this.connenct() : this._closeBluetoothAdapter()
      })

  },

  _checkDeviceCharacteristics(res) {
    const { characteristics } = res

    if (characteristics && characteristics.length) {
      this._characteristics = characteristics

      for (let i = 0, l = characteristics.length; i < l; i++) {
        const { properties, uuid } = characteristics[i], { read, write, notify, indicate } = properties

        if (read) this._characteristic.readId = uuid
        if (write) this._characteristic.writeId = uuid
        if (notify) this._characteristic.notifyId = uuid
        if (indicate) this._characteristic.indicateId = uuid
      }
    } else {
      throw new Error(`This device ${this._device.name || this._device.localName} does not have any characteristics`)
    }

    if (!this._characteristic.writeId || !this._characteristic.notifyId) {
      throw new Error(`This device ${this._device.name || this._device.localName} does not support 'write' or 'notify'.`)
    } else {
      wx.showToast({ title: '获取特征值成功', duration: 2000 })
    }

    return true
  },

  _onBLECharacteristicValueChange(res) {
    const { deviceId, serviceId, characteristicId, value } = res, val = ab2hex(value), { onNotify } = this.configOptions
    console.log(' into this._onBLECharacteristicValueChange ', res)
    console.log(`characteristic ${characteristicId} has changed, now is ${val}`)

    onNotify && isFunction(onNotify) && onNotify(val)
  },

  _notifyBLECharacteristicValueChange() {
    console.log(' into this._notifyBLECharacteristicValueChange ', res, this)

    this.notifyBLECharacteristicValueChange({
      deviceId: this._device.deviceId,
      serviceId: this._serviceId,
      characteristicId: this._characteristic.notifyId,
      state: true
    }).then(res => 'notifyBLECharacteristicValueChange success', res)
      .catch(error => warning(error))
  },

  _closeBLEConnection(bySelf, closeAdapter) {
    bySelf && (this._closeBySelf = true)

    this.closeBLEConnection({ deviceId: this._device.deviceId })
      .then(_ => this._connected = false)
      .then(_ => closeAdapter && this._closeBluetoothAdapter())
      .catch(error => {
        console.log(' into catch error -> this._closeBLEConnection ')
        warning(error)
      })
  },

  _closeBluetoothAdapter() {
    this.closeBluetoothAdapter()
      .then(res => {
        console.log(res, this)
        this.resetState()
        console.log(this)
      })
      .catch(error => {
        warning(error)
        console.log(' into catch error -> this._closeBluetoothAdapter ')
      })
  },

  init(configOptions) {
    if (isObject(configOptions)) this.configOptions = merge(this.configOptions, configOptions)
    this.connenct()
  },

  connenct() {
    console.log(' into connect ', this)
    if (this._openedAdapter) {
      if (this._connected && this._serviceId) {
        this._getBLEDeviceServices()
      } else if (this._device) {
        this._createBLEConnection()
      } else {
        this._getConnectedBluetoothDevices()
        this._startBluetoothDevicesDiscovery()
      }
    } else {
      this._openBluetoothAdapter()
    }
  },

  sendData(data, closeConnection, closeAdapter) {
    if (!data) throw new TypeError()
    const buffer = hex2ab(data)
    console.log(Object.prototype.toString.call(buffer), buffer.byteLength)
    console.log('deviceId', this._device.deviceId, '\nserviceId', this._serviceId, '\nwriteId', this._characteristic.writeId)

    return this.writeBLECharacteristicValue({
      deviceId: this._device.deviceId,
      serviceId: this._serviceId,
      characteristicId: this._characteristic.writeId,
      value: buffer
    }).then(res => {
      if (this.configOptions.keepAlive) {
        if (closeConnection) {
          return this._closeBLEConnection(closeConnection, closeAdapter)  
        } else {
          return res
        }
      } else {
        return this._closeBLEConnection(true, true)
      }
    }).catch(error => {
      warning(error)
      // this.configOptions.autoReconnect && this.configOptions.maxRetryTimes-- ? this.connenct() : this._closeBluetoothAdapter()
    })
  },

  resetState() {
    console.log(' into reset fn ')

    this.configOptions = DEFAULTS_OPTIONS
    merge(this, {
      _openedAdapter: false,
      _discovering: false,
      _device: null,
      _connected: false,
      _serviceId: null,

      _characteristics: null,
      _characteristic: {
        readId: null,
        writeId: null,
        notifyId: null
      }
    })
  }
})

/**
Bluetooth.init({
  keepAlive: true,
  deviceName: 'Yammii',
  // deviceId: '', 若小程序在之前已有搜索过某个蓝牙设备，并成功建立链接，可直接传入之前搜索获取的deviceId直接尝试连接该设备，无需进行搜索操作
  services: ['0000FFE0-0000-1000-8000-00805F9B34FB'],
  characteristicId: '0000FFE1-0000-1000-8000-00805F9B34FB',

  onConnect: function () {
    Bluetooth.sendData('01')
      .then(res => {
        console.log(' 01 ', res)
        // return res
        return Bluetooth.sendData('02')
      }).then(res => {
        console.log(' 02 ', res)
        // return res
        return Bluetooth.sendData('03')
      }).then(res => {
        console.log(' 03 ', res)
      }).catch(warning)
        .finally(_ => {
        // Bluetooth._closeBLEConnection(1, 1)
      })
  },
  onNotify: function (val) {
    console.log(val)
  }
})
 */

function warning(msgOrObj) {
  console.warn(
    isString(msgOrObj) ? msgOrObj : msgOrObj.errMsg || JSON.stringify(msgOrObj)
  )
}


function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}


function hex2ab(str) {
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

export default Bluetooth
