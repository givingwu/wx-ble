
import { warning, when } from '../utils/index.js'

function failControl() {
  // Promise.resolve(this.config.onTimeout && this.config.onTimeout.apply(this, arguments))
  return Promise.resolve(this.config.onFail && this.config.onFail.apply(this, arguments))
    .then(this.resetState)
    .catch(error => warning(error), this.resetState())
}

export default {
  init(error, callback) {
    error && warning(error)

    wx.hideToast()
    wx.showModal({ title: '蓝牙初始化失败', content: '请检查设备设置是否已打开蓝牙开关', showCancel: false })

    callback && callback()
  },

  search(error, callback) {
    wx.hideToast()
    error && warning(error)

    this.config.maxReconnectTimes = --this.config.maxReconnectTimes ? callback && callback() : failControl.apply(this, arguments)
    // wx.showToast({ title: `第${5 - this.config.maxReconnectTimes}次搜索失败`, icon: 'loading' })
  },

  connect(error, callback) {
    wx.hideToast()
    error && warning(error)

    this.config.maxReconnectTimes = --this.config.maxReconnectTimes ? callback && callback() : failControl.apply(this, arguments)
    // wx.showToast({ title: `第${5 - this.config.maxReconnectTimes}次连接失败`, icon: 'loading' })
  },

  finish(error, callback) {
    error && warning(error)
  }
}
