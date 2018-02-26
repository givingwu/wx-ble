
import { isFunction } from '../utils/index'

export default function search() {
  const self = this

  function getConnectedBluetoothDevices() {
    self.getConnectedBluetoothDevices({ services: self.config.connectOptions.services || [] })
      .then(res => {
        const { devices } = res

        if (devices && devices.length) {
          self.config.debug && console.log(devices)

          if (self.checkDevicesWhetherMatch(devices, true)) {
            self.trigger('success')
          } else {
            startBluetoothDevicesDiscovery()
          }
        } else {
          startBluetoothDevicesDiscovery()
        }
      })
      .catch(error => self.trigger('failure', error, getConnectedBluetoothDevices))
  }

  function startBluetoothDevicesDiscovery() {
    self.startBluetoothDevicesDiscovery(self.config.connectOptions)
      .then(res => res.isDiscovering
        ? onBluetoothDeviceFound()
        : self.trigger('failure', error, startBluetoothDevicesDiscovery))
      .catch(error => self.trigger('failure', error, startBluetoothDevicesDiscovery))
  }

  function onBluetoothDeviceFound() {
    self.onBluetoothDeviceFound(res => {
      self.config.debug && console.log('WX-BLE:into self.onBluetoothDeviceFound ', res)
      const { devices } = res
      isFunction(self.config.onFound) && self.config.onFound.call(this, devices)

      if (devices && devices.length) {
        if (self.checkDevicesWhetherMatch(devices)) {
          self.trigger('success')
        }
      }
    })
  }

  getConnectedBluetoothDevices()
}

search.state = 'search'
