import { equalArrays, findConnections } from './utils';
import vars from './variables';

var actions = [{}, {}, {}, {}, {}, {}];
var max_message = [0, 0, 0, 0, 0, 0];
var ret = null;

export default class {
    constructor(_this) {
      this.send = this.send.bind(_this);
      this.registerAction = this.registerAction.bind(_this);
      this.performAction = this.performAction.bind(_this);

      var units;
      if(_this.me.unit == vars.SPECS.CASTLE)
        units = [
          vars.SPECS.CHURCH,
          vars.SPECS.PILGRIM,
          vars.SPECS.CRUSADER,
          vars.SPECS.PROPHET,
          vars.SPECS.PREACHER,
          vars.SPECS.CASTLE
        ];
      else
        units = [_this.me.unit];

      for(var unit in units) {
        vars.moveRadius = vars.SPECS.UNITS[unit].SPEED;
        vars.moveable = findConnections.call(_this, 1, vars.moveRadius);

        if(vars.moveRadius > 0)
          this.registerAction(unit, 'move', {'dxdy': vars.moveable});
        if(unit < 3) {
          var values = {'dxdy': vars.buildable}
          if(unit < 2)
            values['unit'] = [2, 3, 4, 5];
          this.registerAction(unit, 'build', values);
        }
        if(unit == vars.SPECS.PILGRIM)
          this.registerAction(unit, 'mine', {});
        if(unit >= 2)
          this.registerAction(unit, 'give', {'dxdy': vars.buildable});
      }
      //_this.log(actions);
      //_this.log(max_message);
    }

    // Getters
    get actions() {
      return actions;
    }
    get max() {
      return max_message;
    }

    // Call at the end of the turn.
    send() {
      var message = 0;
      var padding = 0;
      if(ret != null) {
        for(var name in actions[this.me.unit]) {
          if(name != ret.name) {
            // preceeding unperformed actions
            var combs = 1;
            var values = actions[this.me.unit][name];
            for(var n in values) {
              combs *= values[n].length;
            }
            padding += combs;
          }
          else {
            // reached performed action
            message = padding + ret.comb + 1;
            break;
          } 
        }
        if(message == 0)
          this.log("CASTLETALK: Could not send action " + ret.name + " with combination " + ret.comb + " for unit " + this.me.unit);
      }
      
      // send action
      this.castleTalk(message);
      ret = null;
      return message;
    }

    // Call at the start of the turn as a castle.
    receive(message, unit) {
      if(message == 0)
        return {};

      var ret2 = {}
      var padding = 0;
      for(var name in actions[unit]) {
        var combs = [1];
        var values = actions[this.me.unit][name];
        for(var n in values) {
          combs.push(combs[combs.length-1] * values[n].length);
        }
        
        if(padding + combs[combs.length-1] >= message) {
          // reached performed action
          var comb = message - padding - 1;
          ret2.name = name;
          
          for(var n in values) {
            var pop = combs.pop();
            ret2.value[n] = values[n][comb % pop];
            comb = parseInt(comb / pop);
          }
          break;
        }
        else
          padding += combs;
      }
      if(ret2 == {})
        this.log("CASTLETALK: Could not receive message " + message + " for unit " + unit);
      
      // return action
      return ret2;
    }

    // Call during first turn.
    registerAction(unit, name, values) {
      // update overall maximum
      var combs = 1;
      for(var n in values) {
        combs *= values[n].length;
      }
      max_message[unit] += combs;

      actions[unit][name] = values;

      return max_message[unit];
    }

    // Call immediately before performing action.
    // i.e. if you call this.move() and then processAction(),
    // it won't work even if you return this.move()'s value.
    performAction(name, value) {
      if(!(name in this.actions[this.me.unit])) {
        this.log("CASTLETALK: Action " + name + " not registered for unit " + this.me.unit);
        return false;
      }

      var comb = 0;
      var combs = 1;
      for(var n in value) {
        var values = actions[this.me.unit][name];
        if(!(n in values)) {
          this.log("CASTLETALK: Action " + name + " has no parameter " + n + " for unit " + this.me.unit);
          return false;
        }
        
        var idx;
        if(Array.isArray(value[n])) {
          idx = values[n].findIndex(function(x) {
            return equalArrays(value[n], x);
          });
        }
        else
          idx = values[n].indexOf(value[n]);
        if(idx == -1) {
          this.log("CASTLETALK: " + value[n] + " is not a valid value for parameter " + n + " of unit " + this.me.unit + "'s " + name);
          return false;
        }
        comb += idx * combs;
        combs *= values[n].length;
      }

      ret = {name: name, comb: comb};
      return true;
    }
  }