
export default (function Recording() {
  let uuid = 0, _isOpenedAdapter = false

  return {
    get isOpenedAdapter () {
      return _isOpenedAdapter
    },
    set isOpenedAdapter (val) {
      _isOpenedAdapter = val
    },
    get: function () {
      return uuid
    },
    new: function () {
      return uuid++
    },
    del: function () {
      return uuid--
    }
  }
}())
