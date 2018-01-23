

export default function finish(closeBySelf) {
  const closeBLEConnection = _ => {
    closeBySelf && (this._closeConnectionBySelf = true) && console.log(this)

    this.closeBLEConnection({ deviceId: this._device.deviceId })
      .then(_ => this.resetState())
      .catch(error => this.trigger('failure', error, closeBLEConnection))
  }

  closeBLEConnection()
}

finish.state = 'state'
