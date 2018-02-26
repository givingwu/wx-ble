
import Recording from '../utils/recording'

export default function init() {
  wx.showToast({ title: '初始化蓝牙中', icon: 'loading' })
  const self = this

  function openBluetoothStateListener() {
    self.onBluetoothAdapterStateChange(bluetoothStateHandler)
  }

  function bluetoothStateHandler(res) {
    self.config.debug && console.log('W-BLE:into bluetoothStateHandler ', res)
    const { available, discovering } = res

    if (!available) {
      wx.hideToast()
      wx.showModal({ title: '无法开启蓝牙连接', content: '请检查设备蓝牙连接是否正常', showCancel: false })
    } else {
      if (discovering) {
        self._discovering = true
      } else {
        self._discovering = false

        if (self.currentState !== 'init') {
          self.currentState = 'init'
        }

        self.trigger('success')
      }
    }
  }

  function getBluetoothAdapterState() {
    return self.getBluetoothAdapterState()
      .then(bluetoothStateHandler)
      .catch(error => self.trigger('failure', error))
  }

  if (Recording.isOpenedAdapter) {
    openBluetoothStateListener()
    getBluetoothAdapterState()
  } else {
    this.openBluetoothAdapter()
      .then(res => {
        wx.showToast({ title: '蓝牙初始化成功', duration: 1000 })
        !!!Recording.isOpenedAdapter && (Recording.isOpenedAdapter = true)
        this.openTimeout()

        openBluetoothStateListener()
        getBluetoothAdapterState()
      })
      .catch(error => this.trigger('failure', error))
  }
}

init.state = 'init'
