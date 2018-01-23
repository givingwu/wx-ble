
var debug = true
var defaultOptions = {
  timeout: 5000,
  keepAlive: false,
  showAllDevice: false,
  maxRetryTimes: 5,
  autoReconnect: true,

  services: [],
  interval: 0,
  allowDuplicatesKey: false
}


// singleton state
var BLUETOOTH_STATE = {
  _opendAdapter: false,
  _opendAdapterStateListener: false,
}


// private state
function Bluetooth(options = defaultOptions) {
  this.options = options
}


Bluetooth.prototype.openBluetoothAdapter = function (next) {
  wx.showToast({ title: '初始化适配器', duration: 2000 })
  var self = this

  if (BLUETOOTH_STATE._opendAdapter) {
    next && next()
  } else {
    wx.openBluetoothAdapter({
      success: function (res) {
        debug && console.log(' wx.openBluetoothAdapter success ', res)
        wx.showToast({ title: '蓝牙初始化成功', duration: 2000 })
        BLUETOOTH_STATE._opendAdapter = true

        next && next()
      },
      fail: function (error) {
        debug && console.log(' wx.openBluetoothAdapter fail ', error)
        wx.hideToast()
        wx.showModal({ title: '蓝牙初始化失败', content: '请在设备设置中打开蓝牙开关', showCancel: false })
      }
    })
  }
}


Bluetooth.prototype.onBluetoothAdapterStateChange = function (next) {
  var self = this

  if (BLUETOOTH_STATE._opendAdapterStateListener) {
    next && next()
  } else {
    BLUETOOTH_STATE._opendAdapterStateListener = true

    wx.onBluetoothAdapterStateChange(function (res) {
      debug && console.log(' wx.onBluetoothAdapterStateChange change ', res)
      var available = res.available, discovering = res.discovering

      if (!available) {
        wx.hideToast()
        wx.showModal({ title: '无法开启蓝牙连接', content: '请检查设备蓝牙连接是否正常', showCancel: false })
      } else {
        if (discovering) {
          self._discovering = true
        } else {
          self._discovering = false
          self.startConnenct()
        }
      }
    })
  }
}


Bluetooth.prototype.getBluetoothAdapterState = function (next) {
  var self = this

  wx.getBluetoothAdapterState({
    success: function(res) {
      debug && console.log(' wx.getBluetoothAdapterState success ', res)
      next && next()
    },
    fail: function(error) {
      debug && console.log(' wx.getBluetoothAdapterState fail ', error)
    }
  })
}


Bluetooth.prototype.getConnectedBluetoothDevices = function (next) {
  var self = this

  wx.getConnectedBluetoothDevices({
    services: self.options.services,
    success: function(res) {
      debug && console.log(' wx.getConnectedBluetoothDevices success ', res)
      next && next()
    },
    fail: function(error) {
      debug && console.log(' wx.getConnectedBluetoothDevices fail ', error)
    } 
  })
}


Bluetooth.prototype.startBluetoothDevicesDiscovery = function (next) {
  var self = this

  wx.startBluetoothDevicesDiscovery({
    success: function(res) {
      debug && console.log(' wx.startBluetoothDevicesDiscovery success ', res)
      next && next()
    },
    fail (error) {
      debug && console.log(' wx.startBluetoothDevicesDiscovery fail ', error)
    }
  })
}


Bluetooth.prototype.stopBluetoothDevicesDiscovery = function (next) {
  var self = this

  wx.stopBluetoothDevicesDiscovery({
    success: function (res) {
      debug && console.log(' wx.stopBluetoothDevicesDiscovery success ', res)
      next && next()
    },
    fail(error) {
      debug && console.log(' wx.stopBluetoothDevicesDiscovery fail ', error)
    }
  })
}


Bluetooth.prototype.onBluetoothDeviceFound = function (next) {
  var self = this

  wx.onBluetoothDeviceFound(function(res){
    var devices = res.devices

    if (devices && devices.length) {
      next && next()
    }
  })
}


Bluetooth.prototype.checkDevicesWhetherMatch = function (next, devices) {
  var self = this, { deviceName, services, characteristicId } = this.configOptions
  var isMatch = false

  for (var i = 0, l = devices.length; i < l; i++) {
    devices[i].advertisData && console.log(ab2hex(devices[i].advertisData))

    if (devices[i].name === deviceName || devices[i].localName === deviceName) {
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
        next && next()
      }
    })
  } else {
    // this.configOptions.autoReconnect && this.configOptions.maxRetryTimes-- && this.connenct() || this._closeBluetoothAdapter()
  }
}


Bluetooth.prototype.createBLEConnection = function (next) {
  var self = this

  wx.createBLEConnection({
    deviceId: this._device.deviceId,
    success: function(res) {
      debug && console.log(' wx.createBLEConnection success ', res)
      this._connected = true
      next && next()
    },
    fail(error) {
      debug && console.log(' wx.createBLEConnection fail ', error)
      this._connected = false
    }
  })
}


Bluetooth.prototype.onBLEConnectionStateChange = function (next) {
  if (this._closeBySelf) return this._closeBySelf = null

  var self = this, connected = res.connected, deviceId = res.deviceId

  if (connected) {
    this._connected = true
    next && next()
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


Bluetooth.prototype.startConnenct = function () {}

