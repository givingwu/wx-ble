
const configOptions = {
  autoConnect: false,
  debug: true,
  timeout: false,  // seconds
  keepAlive: false,
  autoFixConnect: true,
  maxReconnectTimes: 5,

  connectOptions: {
    interval: 0,
    services: [],
    allowDuplicatesKey: false,
    deviceName: 'YourDeviceName',
    // characteristicId: '0000FFE1-0000-1000-8000-00805F9B34FB'
  },

  onFound (devices) {
    console.log(devices)
  },

  onConnect () {
    console.log(`now this bluetooth instance ${this.config.connectOptions.deviceName || this.uuid} has been becoming connected state.`)

    // 如果 keepAlive 为真的话，需要自己手动在 sendData 成功后执行
    // `return this.trigger('success', true)`
    // 以触发 finish 状态以进入关闭蓝牙连接和蓝牙适配器操作
    this.sendData('01').then(res => {
      console.log(res)
      wx.showToast({
        title: '发送数据成功',
      })
    })
  },

  onNotify (value) {
    console.log(`The value be notified is ${value}`)
  },

  onTimeout () {
    console.log(`Sorry, current bluetooth ${this.config.connectOptions.deviceName || this.uuid} connect timeout.`)
  },

  onFail (error) {
    console.log(`Sorry, current bluetooth ${this.config.connectOptions.deviceName || this.uuid} connect fail. Error info ${error}`)
  }
}

export default configOptions
