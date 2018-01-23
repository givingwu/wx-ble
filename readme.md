
# wx-bluetooth

可能是Github上迄今为止**最适合前端**、**最易用**的微信小程序蓝牙实现。


## Features

+ 简单丰富的API
+ 支持自动修复连接，重新连接，管理和收集状态
+ 支持connect `timeout`的实现
+ 支持初始化多个蓝牙实例
+ 支持`connect`,`notify`,`timout`,`fail`回调
+ 支持`wx.method.paramter.success`方法的 `promisify`


## Usage

1. npm:

```
npm install wx-ble
```

then

```
import Bluetooth from 'wx-ble'
```

2. 直接下载项目后，在页面引入。**建议将项目放在 `utils` or `vendors` 目录下，并新建名为`bluetooth`的目录后，将文件下载到该目录中**:

```
cd yourpoject/utils
mkdir bluetooth
git clone https://github.com/GivingWu/wx-bluetooth.git
```

then

```
import Bluebooth from 'yourRelativePath/bluetooth/index.js'
```


## Example

```js
const bluebooth = new Bluetooth({   // configOptions 参考下面的API
  debug: false,
  timeout: 5,
  keepAlive: true,
  onConnect: function () {
    this.sendData('01').then(res => this.sendData('02')).then(res => this.sendData('03')).then(res => this.trigger('success'))
  }
})
```


## 实现

通过[trigger](/utils/trigger.js)`success` or `failure`进入成功或失败状态完成状态的收集和触发。

1. [初始化-init](/states/init.js)
2. [搜索-search](/states/search.js)
3. [连接-connect](/states/connect.js)
4. [通信-transfer](/states/transfer.js)
5. [结束-finish](/states/finish.js)


## API

### [config](/config/index.js) 配置项：

| option name | type      |  parameter  | default value | description |
| ---------   | -------:  | :---------: | :-----------: | :---------: |
| `debug`     | `Boolean` |             |    `true`     | 打开console，debug程序内部状态的变化 |
| `timeout`   | `Number`  |             |    `10`       | 以`s`(秒)为单位。如果为0，则关闭该项。在蓝牙的连接过程中，若在该 timeout秒时间内无法连接，则进入 `timeout` 回调 |
| `keepAlive` | `Boolean` |             |    `false`    | 保持蓝牙通讯的连接 |
| `autoFixConnect`| `Boolean` |         |    `true`     | 调用方法失败进入`fail`后将自动重新调用重连 |
| `maxReconnectTimes`| `Number` |       |    5          | 最大重新连接次数 |
| `onConnect` | `Function` |            |               | 连接成功后的回调，进行传输数据等操作 |
| `onNotify`  | `Function` |   value    |               | 收到蓝牙传输过来的值的回调，通过参数`value`查看该值 |
| `onTimeout` | `Function` |   error    |               | 连接超时的回调函数（连接超时函数若不自定义会自动进入`onFail`函数） |
| `onFail`    | `Function` |   error    |               | 再重连`maxReconnectTimes`后，会调用连接失败后的回调 |
| `connectOptions` | `Object`  |        |   [look](#connectOptions)  | `connectOptions` 是一个对象，用来设置**连接蓝牙的配置项**。蓝牙是否能够连接，跟此配置项有莫大关系。 |


### [*connectOptions*]{#connectOptions} 配置项：

| property name | type     | default value | descripion | details |
| ------------- | -------: | :-----------: | :--------: | :-----: |
| `interval`    | `Number` | 0             | 上报设备的间隔，默认为0，意思是找到新设备立即上报，否则根据传入的间隔上报 | [更多](https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxstartbluetoothdevicesdiscoveryobject) |
| `services`    | `Array`  | `[]`          | 蓝牙设备主 service 的 uuid 列表 | [更多](https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxstartbluetoothdevicesdiscoveryobject) |
| `allowDuplicatesKey` | `Boolean` | `false` | 是否允许重复上报同一设备， 如果允许重复上报，则onDeviceFound 方法会多次上报同一设备，但是 RSSI 值会有不同 | [更多](https://mp.weixin.qq.com/debug/wxadoc/dev/api/bluetooth.html#wxstartbluetoothdevicesdiscoveryobject) |
| `deviceName` | `String`  | `''`          | 通过该项匹配当前设备，如果设备名称包含该字段，则认为匹配 |     |
| `characteristicId` | `String`  | `''`    | 该项目前未使用 |     |


### 实例方法
| method name |  parameter  | default value |   return   | description |
| ----------- | ----------: | :-----------: | :--------: | :---------: |
| `sendData`  |  data       | `''`          | {Promise}  | 向已连接的蓝牙发送数据(该方法必须在蓝牙连接成功后调用) |
| `resetState`|             |               |            | 清空并重置内部状态 |


## TODOs

1. timeout
2. issue ?! 欢迎[issue]()，将尽力在一周内解决。
3. 欢迎[pull](https://github.com/GivingWu/wx-bluetooth/pulls)


## License

[MIT](http://opensource.org/licenses/MIT)
