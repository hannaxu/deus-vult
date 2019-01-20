import { equalArrays, findConnections } from './utils';
import vars from './variables';

var actions = [{}, {}, {}, {}, {}, {}];
var max_message = [0, 0, 0, 0, 0, 0];
var ret = null;

export default class {
    constructor(_this) {
      this.send = this.send.bind(_this);
      this.receive = this.receive.bind(_this);
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

      for(var i in units) {
        var unit = units[i];
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
            //this.log("CASTLETALK: Sent - unit:" + this.me.unit + " action:" + ret.name + " comb:" + ret.comb);
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
      if(typeof(message) != 'number'){
        this.log("CASTLETALK: Message must be a number");
      }
      if(message == 0)
        return {};

      var ret2 = {}
      var padding = 0;
      for(var name in actions[unit]) {
        var combs = 1;
        var values = actions[unit][name];
        for(var n in values) {
          combs *= values[n].length;
        }
        
        if(padding + combs >= message) {
          // reached performed action
          var comb = message - padding - 1;
          ret2[name] = {};

          for(var n in values) {
            ret2[name][n] = values[n][comb % values[n].length];
            comb = parseInt(comb / values[n].length);
          }
          break;
        }
        else
          padding += combs;
      }
      if(Object.keys(ret2).length == 0)
        this.log("CASTLETALK: Could not receive message " + message + " for unit " + unit);
      
      // return action
      this.log("CASTLETALK: Recv - unit:" + unit + " actions:" + JSON.stringify(ret2));
      return ret2;
    }

    // Called upon initialization.
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

    // Call when performing an action.
    performAction(name, value) {
      if(!(name in actions[this.me.unit])) {
        this.log("CASTLETALK: Action " + name + " not registered for unit " + this.me.unit);
        return false;
      }

      var values = actions[this.me.unit][name];
      for(var n in value) {
        if(!(n in values)) {
          this.log("CASTLETALK: Action " + name + " has no parameter " + n + " for unit " + this.me.unit);
          return false;
        }
      }

      var comb = 0;
      var combs = 1;
      for(var n in values){
        if(!(n in value)) {
          this.log("CASTLETALK: Action " + name + " did not receive parameter " + n + " for unit " + this.me.unit);
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

      this.log("CASTLETALK: Perf - unit:" + this.me.unit + " action:" + name + " value:" + JSON.stringify(value));
      ret = {name: name, comb: comb};
      return true;
    }
  }