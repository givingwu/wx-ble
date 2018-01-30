
import { ab2hex, isFunction } from '../utils/index'

export default function transfer(isValid) {
  const self = this, { onConnect, onNotify } = this.config

  function onBLECharacteristicValueChange(res) {
    self.config.debug && console.log('WX-BLE:into onBLECharacteristicValueChange ', res)
    const { deviceId, serviceId, characteristicId, value } = res, val = ab2hex(value)
    // self.config.debug && console.log(`WX-BLE:characteristic ${characteristicId} has changed, now is ${val}`)

    onNotify && isFunction(onNotify) && onNotify.call(self, val)
  }

  function notifyBLECharacteristicValueChange() {
    self.notifyBLECharacteristicValueChange({
      deviceId: self._device.deviceId,
      serviceId: self._serviceId,
      characteristicId: self._characteristic.notifyId,
      state: true
    }).then(_ => {
      setTimeout(_ => {
        self.onBLECharacteristicValueChange(onBLECharacteristicValueChange.bind(self))
        onConnect && isFunction(onConnect) && onConnect.call(self)
      }, 1000)
    }).catch(error => self.trigger('failure', error, notifyBLECharacteristicValueChange))
  }

  notifyBLECharacteristicValueChange()
}

transfer.state = 'transfer'
