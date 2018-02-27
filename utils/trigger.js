
import errors from 'errors'

/**
 * triggerCommands
 * @desc  通过传入的参数改变当前状态
 * @param  {String}   name
 * @return {Function}
 */
export default function triggerCommands() {
  return function changeState(name) {
    const state = this.currentState
    let action = this.states[state][name]

    this.config.debug && console.log(`W-TGR:Trying to change state from '${state}.${name}' to '${'function' === typeof action ? action.state : action}' state.`)
    // this.config.debug && console.log(`state: ${state}, \nname:${name}, \naction:${'function' === typeof action ? action.state : action}`)

    if (action) {
      if ('string' === typeof action && ~action.indexOf('error')) action = errors[action.split('.')[1]]

      if ('function' !== typeof action) {
        throw new Error(`W-TGR:Have you ever defined this action before? \ntype: '${typeof action}'\nname: '${name}'\nstate: '${state}'`)
      } else {
        return exec.apply(this, Array.prototype.slice.call(arguments, 1))
      }
    } else {
      return console.warn(`W-TGR:The ${state} does not have internal method ${name}`)
    }

    function exec() {
      try {
        action.apply(this, arguments)

        if (state === 'init' && name === 'failure') {
          this.currentState = 'start'
        } else {
          this.currentState = action.state
        }

        this.config.debug && console.log(`W-TGR:Change state success, Previous state:${state}, Be called mehtod name: ${name === 'failure' ? 'errors.' + state : name}, Current state: ${this.currentState}`)
      } catch (error) {
        console.error(error, `W-TGR:at action:${action} - name:${name}. `)
        this.currentState = state
      }
    }
  }
}

/**
init = function () {
  console.log('into init ')
}

search = function () {
  console.log('into search ')
}

connect = function () {
  console.log('into connect ')
}


transfer = function () {
  console.log('into transfer ')
}


finish = function () {
  console.log('into finish ')
}
 */