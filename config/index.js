
const configOptions = {
  debug: true,
  timeout: 10,  // second
  keepAlive: false,
  autoFixConnect: true,
  maxReconnectTimes: 5,

  connectOptions: {
    interval: 0,
    services: [],
    allowDuplicatesKey: false,

    deviceName: '',
    // characteristicId: '0000FFE1-0000-1000-8000-00805F9B34FB'
  },

  onConnect: function () {
    console.log(`now this bluetooth instance ${this.config.connectOptions.deviceName || this.uuid} has been becoming connected state.`)
    this.sendData('01').then(res => {
      console.log(res)
      wx.showToast({
        title: '发送数据成功',
      })
    })
  },

  onNotify: function (value) {
    console.log(`The value be notified is ${value}`)
  },

  onTimeout: function (error) { 
    console.log(`Sorry, current bluetooth ${this.config.connectOptions.deviceName || this.uuid} connect timeout.`)

    configOptions.onFail && configOptions.onFail.call(this, arguments)
  },

  onFail: function (error) {
    console.log(`Sorry, current bluetooth ${this.config.connectOptions.deviceName || this.uuid} connect fail. Error info ${error}`)
  }
}

export default configOptions
