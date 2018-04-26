# NOTES:
> 目前时间很紧，对于无法作出及时回应的issue表示抱歉。同时对于此项目的维护时间也很有限，非常抱歉。使用时请**慎重**翻阅之前 `issue`，同时欢迎大家`PR`！

# wx-bluetooth

可能是Github上迄今为止**最适合前端**、**最易用**的微信小程序蓝牙实现。
[iOS bluetooth_run_screenshot](http://7xrwmf.com1.z0.glb.clouddn.com/wx-bluetooth_screenshot)

- [Features](#Features)
- [Usage](#Usage)
- [Example](#Example)
- [实现](#实现)
- [API](#API)
    - [config](#config)
    - [connectOptions](#connectOptions)
    - [实例方法](#实例方法)
- [TODOs](#TODOs)
- [ChangeLog](#ChangeLog)
- [License](#License)


<a name="Features"></a>
## Features

+ 简单强大的API
+ 使用状态机自动管理状态
+ 支持**自动修复连接**，**重新连接**
+ 支持connect `timeout` **连接超时机制**
+ 支持初始化多个蓝牙实例
+ 支持`found`,`connect`,`notify`,`timout`,`fail`回调
+ 支持`wx.method.paramters.success`方法的`promisify`

<a name="Usage"></a>
## Usage

+ npm:

  ```js
  npm install wx-ble
  ```

  then

  ```js
  import Bluetooth from 'wx-ble'
  ```

+ 直接下载项目后，在页面引入。**建议将该工具方法放在 `utils` or `vendors` 目录下，并新建名为`bluetooth`的目录后，将文件下载到该目录中**:

  ```bash
  cd ProjectPath/utils
  git clone https://github.com/vuchan/wx-bluetooth.git
  ```

  then

  ```js
  import Bluebooth from 'yourRelativePath/bluetooth/index.js'
  ```

<a name="Example"></a>
## Example

注： 如果`keepAlive`配置项为`true`的话，需要手动在 `sendData` 方法成功`then`后写上 `return this.trigger('success', true)` 以触发 `finish` 。

```js
const bluebooth = new Bluetooth({   // configOptions 参考下方的API
  debug: false,
  keepAlive: true,    // 保持持续链接状态
  // 必须配置 `connectOptions` 中的 `deviceName` 和 `services` 以匹配你想匹配的蓝牙设备
  connectOptions: {
    interval: 0,
    services: [''], // your device services array
    allowDuplicatesKey: false,
    deviceName: '', // device name
    // characteristicId: ''
  },
  onConnect: function () {
    // 如果 keepAlive 为`true`的话，需要自己手动在 sendData 成功后执行 `return this.trigger('success', true)` 以触发 `finish` 状态以进入关闭蓝牙连接和蓝牙适配器操作
    this.sendData('01').then(res => this.sendData('02')).then(res => this.sendData('03')).then(res => this.trigger('success'))
  }
})

bluebooth.start();
```

<a name="实现"></a>
## 实现

通过[triggerCommands](/utils/trigger.js)触发`success` or `failure`进入成功或失败状态。

1. [初始化-init](/states/init.js)
2. [搜索-search](/states/search.js)
3. [连接-connect](/states/connect.js)
4. [通信-transfer](/states/transfer.js)
5. [结束-finish](/states/finish.js)

<a name="API"></a>
## API

<a name="config"></a>
### [config](/config/index.js) 配置项：

| option name | type      |  parameter  | default value | description |
| ---------   | :------:  | :---------: | :------------ | :---------- |
| `autoConnect`| `Boolean`|             |    `false`    | 初始化实例时完成后自动根据 `connenctOptions` 连接蓝牙，否者手动调用实例的 `start` 方法 |
| `debug`     | `Boolean` |             |    `true`     | 打开console，debug程序内部状态的变化 |
| `timeout`   | `Number`  |             |    `false`       | 以`s`(秒)为单位。在蓝牙的连接过程中，若在该 timeout 秒时间内无法连接，则进入 `timeout` 回调。如果为`0 or false`，则关闭该项。|
| `keepAlive` | `Boolean` |             |    `false`    | 保持蓝牙通讯的连接 |
| `autoFixConnect`| `Boolean` |         |    `true`     | 蓝牙断开后，自动修复蓝牙连接 |
| `maxReconnectTimes`| `Number` |       |    5          | 最大重连次数 |
| `onFound`   | `Function` | `devices`  |    `[]`       | 当蓝牙发现新设备时，接收第一个参数 `devices` 获取所有设备 |
| `onConnect` | `Function` |            |               | 连接成功后的回调，进行传输数据等操作 |
| `onNotify`  | `Function` |   value    |               | 收到蓝牙传输过来的值的回调，通过参数`value`查看该值 |
| `onTimeout` | `Function` |   error    |               | 连接超时的回调函数（连接超时函数若不自定义会自动进入`onFail`函数） |
| `onFail`    | `Function` |   error    |               | 再重连`maxReconnectTimes`后，会调用连接失败后的回调 |
| `connectOptions` | `Object`  |        |   见下面`connectOptions API`  | `connectOptions` 是一个对象，用来设置**连接蓝牙的配置项**。**蓝牙是否能够连接，跟此配置项有莫大关系**。 |

<a name="connectOptions"></a>
### [connectOptions](/config/index.js#L9) 配置项：

| property name | type     | default value | descripion | details |
| ------------- | :------: | :-----------: | :--------- | :------ |
| `interval`    | `Number` | 0             | 上报设备的间隔，默认为0，意思是找到新设备立即上报，否则根据传入的间隔上报 | [更多](https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxstartbluetoothdevicesdiscoveryobject) |
| `services`    | `Array`  | `[]`          | 蓝牙设备主 service 的 uuid 列表 | [更多](https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxstartbluetoothdevicesdiscoveryobject) |
| `allowDuplicatesKey` | `Boolean` | `false` | 是否允许重复上报同一设备， 如果允许重复上报，则onDeviceFound 方法会多次上报同一设备，但是 RSSI 值会有不同 | [更多](https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxstartbluetoothdevicesdiscoveryobject) |
| `deviceName` | `String`  | `''`          | 通过该项匹配当前设备，如果设备名称包含该字段，则认为匹配 |     |
| `characteristicId` | `String`  | `''`    | 该项目前未使用 |     |

<a name="实例方法"></a>
### 实例方法
| method name |  parameter  | default value |   return   | description |
| ----------- | :---------: | :-----------: | :--------: | :---------- |
| `start`     |             |               |            | 手动开启该实例对象的蓝牙连接 |
| `sendData`  |  `data`     | `''`          | {Promise}  | 向已连接的蓝牙设备发送数据(该方法必须在蓝牙连接成功后调用) |
| `resetState`|             |               |            | 清空和重置内部状态，关闭蓝牙连接，如果不再存在蓝牙实例，则关闭蓝牙适配器 |

<a name="TODOs"></a>
## TODOs

1. 欢迎[issue](https://github.com/vuchan/wx-bluetooth/issues)
2. 欢迎[pull/request](https://github.com/vuchan/wx-bluetooth/pulls)
3. 如果`API`有不甚清晰的地方，请[issue](https://github.com/vuchan/wx-bluetooth/issues)

<a name="ChangeLog"></a>
## ChangeLog

### 2018-1-30
1. finished `timeout` logic.
2. fixed `resetState` function.

### 2018-2-2
1. Modified the code of example.

### 2018-2-5
1. Updated the TODOs of this doc.
2. Modified API doc.

### 2018-2-26
1. add a new config option `autoConnect`
2. add new callback function `onFound`

### 2018-4-08
1. fixed the `timeout` method will be auto trigger at `init` state `bluetoothStateHandler` function.
2. add a fallback feature to the `start` function.

<a name="License"></a>
## License

[MIT](http://opensource.org/licenses/MIT)
