import vars from './variables';

import {coord8Encrypt, coord8Decrypt, coord8Encrypt2, coord8Decrypt2} from './conversion';
import CastleTalk from './castleTalk';
import { equalArrays } from './utils';

export function testAll(verbose=true){
  var passing = true;
  var output;
  if(verbose){
    this.log("");
    output = this;
  }
  else
    output = console;

  passing &= testCoord8.call(output);
  passing &= testCastleTalk.call(output);
  
  if(verbose)
    this.log("--------");
  if(passing){
    this.log("[PASSED] All tests passed");
    return true;
  }
  else{
    this.log("[FAILED] One or more tests failed");
    return false;
  }
}

export function testCoord8(){
  for(var max = 32; max <= 60; max++){
    for(var x = 0; x < max; x++){
      var result = coord8Decrypt2(coord8Encrypt2(x, x, max), max, coord8Decrypt(coord8Encrypt(x, x, max), max)[0]);
      if(result[0] != x || result[1] != x){
        this.log("[FAILED] Coordinate 8-bit encryption - x:" + x + " max:" + max);
        return false;
      }
    }
  }
  this.log("[PASSED] Coordinate 8-bit encryption");
  return true;
}

export function testCastleTalk(){
  // can't send other units' signals
  // only test yourself
  var unit = 0;
  try{
    while(Object.keys(vars.CastleTalk.actions[unit]).length == 0)
      unit++;
  }
  catch(err){
    this.log("[FAILED] CastleTalk encoding - vars.CastleTalk is empty or nonexistent");
  }

  if(vars.CastleTalk.max[unit] > 255){
    this.log("[FAILED] CastleTalk encoding - max of " + vars.CastleTalk.max[unit] + " for unit " + unit);
    return false;
  }
  
  for(var name in vars.CastleTalk.actions[unit]){
    var values = vars.CastleTalk.actions[unit][name];
    
    // generate all possible action values
    var value_combs = [{}];
    for(var n in values){
      var value_combs_new = [];
      for(var value_i in value_combs){
        var value = value_combs[value_i];
        for(var i in values[n]){
          var value_new = Object.assign({}, value);
          value_new[n] = values[n][i];
          value_combs_new.push(value_new);
        }
      }
      value_combs = value_combs_new;
    }

    // test encoding equality
    for(var value_i in value_combs){
      var value = value_combs[value_i];

      // send and receive
      vars.CastleTalk.performAction(name, value);
      var received = vars.CastleTalk.receive(vars.CastleTalk.send(), unit)[name];

      for(var n in value){
        var equal;
        if(Array.isArray(value[n]))
          equal = equalArrays(value[n], received[n]);
        else
          equal = value[n] == received[n];
        
        if(!equal){
          this.log("[FAILED] CastleTalk encoding - unit:" + unit + " action:" + name + " value:" + value);
          return false;
        }
      }
    }
    this.log("[PASSED] CastleTalk encoding");
    return true;
  }
}