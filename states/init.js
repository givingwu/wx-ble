
import Recording from '../utils/recording'

export default function init() {
  wx.showToast({ title: '初始化蓝牙中', icon: 'loading' })
  const self = this

  function openBluetoothStateListener() {
    self.onBluetoothAdapterStateChange(bluetoothStateHandler)
  }

  function bluetoothStateHandler(res) {
    const { debug, timeout } = self.config;
    const { available, discovering } = res

    debug && console.log('W-BLE:into bluetoothStateHandler ', res)

    if (!available) {
      wx.hideToast()
      wx.showModal({ title: '设备蓝牙不可用', content: '请检查设备蓝牙是否打开', showCancel: false })
    } else {
      if (discovering) {
        self._discovering = true
        timeout && self.openTimeout()
      } else {
        self._discovering = false
        // wx.showModal({ title: '蓝牙搜索状态被关闭', content: '请检查设备蓝牙是否正常', showCancel: false })

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

        openBluetoothStateListener()
        getBluetoothAdapterState()
      })
      .catch(error => this.trigger('failure', error))
  }
}

init.state = 'init'
