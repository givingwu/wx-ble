import config from 'config/index'
import Recording from 'utils/recording'
import triggerCommands from 'utils/trigger'
import installPromiseify from 'utils/promiseify'
import {
  merge,
  isNumber,
  ab2hex,
  hex2ab,
  warning,
  hasSameUUID
} from 'utils/index'

import init from 'states/init'
import search from 'states/search'
import connect from 'states/connect'
import transfer from 'states/transfer'
import finish from 'states/finish'

let promisified = false

export default class Bluetooth {
  constructor(options = {}) {
    if (!promisified) installPromiseify.call(Bluetooth.prototype), promisified = true
    this.uuid = Recording.new()
    this.config = merge({}, config, options)
    this.currentState = 'start'
    this.states = {
      'start': {
        init: init
      },
      'init': {
        success: search,
        failure: 'errors.init'
      },
      'search': {
        success: connect,
        failure: 'errors.search'
      },
      'connect': {
        success: transfer,
        failure: 'errors.connect'
      },
      'transfer': {
        success: finish,
        failure: 'errors.transfer'
      },
      'finish': {
        success: this.resetState,
        failure: 'errors.finish'
      }
    }

    this.trigger = triggerCommands.call(this)
    this.config.autoConnect && this.start()
  }

  start() {
    this.trigger('init')
  }

  openTimeout() {
    // console.log(' this method openTimeout be called. ')
    const {
      debug,
      timeout,
      onTimeout,
      onFail
    } = this.config
    if (!timeout || !isNumber(timeout)) return

    let timeoutId = setTimeout(_ => {
      let state = this.currentState
      debug && console.log(`W-BLE:Current state is ${state}`)

      if (!state || (state && ~state.indexOf('error')) || state === 'init' || state === 'search') {
        onTimeout && onTimeout.call(this)
        onFail && onFail.call(this)
        this.resetState()
      }

      clearTimeout(timeoutId)
    }, +timeout * 1000)
  }


  // 开发者工具和 Android 上获取到的deviceId为设备 MAC 地址，iOS 上则为设备 uuid。因此deviceId不能硬编码到代码中
  checkDevicesWhetherMatch(devices, isConnected) {
    const self = this,
      {
        deviceName,
        services,
        characteristicId
      } = this.config.connectOptions
    let isMatch = null

    for (let i = 0, l = devices.length; i < l; i++) {
      devices[i].advertisData && console.log(ab2hex(devices[i].advertisData))
      const UUIDs = devices[i].advertisServiceUUIDs

      if ((devices[i].name === deviceName || devices[i].localName === deviceName) && (services.length && UUIDs && UUIDs.length && hasSameUUID(services, UUIDs))) {
        isConnected && (this._connected = true)
        this._device = devices[i]
        isMatch = true

        break
      }
    }

    if (isMatch) {
      wx.showToast({
        title: '已找到目标设备',
        duration: 2000,
        complete() {
          self._discovering && self.stopBluetoothDevicesDiscovery().catch(warning)
        }
      })
    }

    return isMatch
  }


  checkDeviceServices(res) {
    const {
      services
    } = res, configServices = this.config.connectOptions.services
    let isValid = false

    for (let i = 0, l = services.length; i < l; i++) {
      const {
        uuid,
        isPrimary
      } = services[i]

      if (~configServices.indexOf(services[i].uuid)) {
        this._serviceId = uuid
        isValid = true

        break
      }
    }

    // /**
    if (!isValid) throw new Error(' Cannot got a valid serviceId on this device ' + (this._device.deviceName || this._device.localName || this._device.deviceId))
    // */
    return isValid
  }


  checkDeviceCharacteristics(res) {
    const {
      characteristics
    } = res

    if (characteristics && characteristics.length) {
      this._characteristics = characteristics

      for (let i = 0, l = characteristics.length; i < l; i++) {
        const {
          properties,
          uuid
        } = characteristics[i], {
          read,
          write,
          notify,
          indicate
        } = properties

        if (read) this._characteristic.readId = uuid
        if (write) this._characteristic.writeId = uuid
        if (notify) this._characteristic.notifyId = uuid
        if (indicate) this._characteristic.indicateId = uuid
      }
    }

    if (!this._characteristic.writeId || !this._characteristic.notifyId) {
      throw new Error(`This device ${this._device.name || this._device.localName} does not support 'write' or 'notify' characteristic.`)
    } else {
      wx.showToast({
        title: '获取特征值成功',
        duration: 2000
      })
    }

    return true
  }


  /**
   * sendData
   * @desc    在连接成功后 发送数据 方法应该在 Config.onConnect 方法中调用才有效因为只有此时蓝牙才准备就绪
   * @param   {String}    str
   * @return  {Promies}
   */
  sendData(str) {
    if (!this._connected || !this._serviceId || !this._characteristic.writeId) throw new ReferenceError(`Invoke 'sendData' method must after the instance has been connected or check those properties: ${this._connected} serviceId: ${this._serviceId} writeId: ${this._characteristic.writeId}`)
    if (!str) throw new ReferenceError()
    if (typeof str !== 'string') str += ''

    const buffer = hex2ab(str)
    // console.log(Object.prototype.toString.call(buffer), buffer.byteLength)
    // console.log('deviceId', this._device.deviceId, '\nserviceId', this._serviceId, '\nwriteId', this._characteristic.writeId)

    return this.writeBLECharacteristicValue({
      deviceId: this._device.deviceId,
      serviceId: this._serviceId,
      characteristicId: this._characteristic.writeId,
      value: buffer
    }).then(res => {
      // 如果 keepAlive 为真的话，需要自己手动在 sendData 成功后执行
      // `return this.trigger('success', true)`
      // 以触发 finish 状态以进入关闭蓝牙连接和适配器操作
      if (this.config.keepAlive) {
        return res
      } else {
        return this.trigger('success', true)
      }
    }).catch(error => this.trigger('failure', error, this.sendData, str))
  }

  resetState() {
    this._connected = false
    this._serviceId = null
    this._characteristic = {}
    Recording.del()

    this.config.debug && console.log('W-BLE: into this.resetState(), Bluetooth instance numbers: ', Recording.get())

    // 不存在 bluetooth 实例并且已打开适配器则关闭 蓝牙适配器
    if (!Recording.get() && Recording.isOpenedAdapter) {
      this.closeBluetoothAdapter().finally(_ => {
        this.currentState = 'start'
        Recording.isOpenedAdapter = false
      })
    }
  }
}