

export default function finish(closeBySelf) {
  const closeBLEConnection = _ => {
    closeBySelf && (this._closeConnectionBySelf = true) && self.config.debug && console.log(`W-BLE:into ${this._device.deviceName || this._device.localName || this._device.deviceId} closeBLEConnection `)

    this.closeBLEConnection({ deviceId: this._device.deviceId })
      .then(_ => this.resetState())
      .catch(error => this.trigger('failure', error, closeBLEConnection))
  }

  closeBLEConnection()
}

finish.state = 'state'
