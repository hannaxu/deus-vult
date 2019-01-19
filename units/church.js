import vars from '../variables';
import * as utils from '../utils';
import { sendMessage } from '../communication';
import * as buildUtils from '../buildUtils';

var deposits = 0;
var buildCount = [0,0,0,0,0,0];
var team;
var deposits = [0,[],[]]; //total, karb locs, fuel locs
var buildOptPil = []; //pilgrims,

export default function castleTurn() {
  //this.log("I am a Church at "+this.me.x+" "+this.me.y);
  //this.log("Resources: "+this.karbonite+" "+this.fuel);
  if (vars.firstTurn) {
    team = this.me.team;
    var locs = buildUtils.optBuild(this.me.x, this.me.y);
    deposits = locs[0];
    buildOptPil = locs[1];

    vars.firstTurn = false;
  }

  var closePilgrim = 0;
  for( var i = 0; i < vars.visibleRobots.length; i++ ) {
    if( vars.visibleRobots[i].team == team )
      if( vars.visibleRobots[i].unit == vars.SPECS.PILGRIM )
        closePilgrim += 1;
  }

  if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if ((closePilgrim < deposits[0])) {
      for (var i = 0; i < buildOptPil.length; i++) {
        var x = this.me.x+buildOptPil[i][1];
        var y = this.me.y+buildOptPil[i][0];;
        if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
          sendMessage.call(this, i, buildOptPil[i][1]**2+buildOptPil[i][0]**2);
          //this.log("Building pilgrim at "+x+" "+y);
          buildCount[2]++;
          return this.buildUnit(vars.SPECS.PILGRIM, buildOptPil[i][1], buildOptPil[i][0]);
        }
      }
    }
  }
}
