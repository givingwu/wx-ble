
export default function connect() {
  const self = this

  function createBLEConnection() {
    self.onBLEConnectionStateChange(onBLEConnectionStateChange.bind(self))

    return self.createBLEConnection({ deviceId: self._device.deviceId })
      .then(_ => {
        console.log('WX-BLE:self.currentState ', self.currentState)
        if (self.currentState !== 'connect') self.currentState = 'connect'

        self._connected = true
        wx.showToast({ title: '连接设备成功', duration: 2000 })
      })
      .catch(error => self.trigger('failure', error, createBLEConnection))
  }

  function onBLEConnectionStateChange(res) {
    if (this._closeConnectionBySelf) return this._closeConnectionBySelf = null
    const { connected, deviceId } = res

    if (connected) {
      this._connected = true
      getBLEDeviceServices.call(this)
    } else {
      this._connected = false
      this.config.autoFixConnect && wx.showModal({
        title: '蓝牙连接中断',
        content: '连接异常断开，设备将自动重新链接',
        showCancel: false,
        success() {
          wx.showToast({ title: '自动重连中', icon: 'loading' })
          createBLEConnection()
        }
      })
    }
  }

  function getBLEDeviceServices() {
    if (self._serviceId) {
      getBLEDeviceCharacteristics()
    } else {
      self.getBLEDeviceServices({ deviceId: self._device.deviceId })
        // self lost? WTF?!!
        .then(res => self.checkDeviceServices(res) && getBLEDeviceCharacteristics())
        .catch(error => self.trigger('failure', error, getBLEDeviceServices))
    }
  }

  function getBLEDeviceCharacteristics() {
    self.getBLEDeviceCharacteristics({ deviceId: self._device.deviceId, serviceId: self._serviceId })
      .then(res => self.checkDeviceCharacteristics(res) && self.trigger('success'))
      .catch(error => self.trigger('failure', error, getBLEDeviceCharacteristics))
  }

  if (!this._connected) {
    createBLEConnection()
  } else {
    getBLEDeviceServices()
  }
}

connect.state = 'connect'
