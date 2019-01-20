import vars from '../variables';
import * as utils from '../utils';
import { sendMessage } from '../communication';
import * as buildUtils from '../buildUtils';

var buildCount = [0,0,0,0,0,0];
var team;
var deposits = [0,[],[]]; //total, karb locs, fuel locs
var attackPos = null;

export default function castleTurn() {
  //this.log("I am a Church at "+this.me.x+" "+this.me.y);
  //this.log("Resources: "+this.karbonite+" "+this.fuel);
  if (vars.firstTurn) {
    team = this.me.team;
    deposits = buildUtils.resources.call(this);

    vars.firstTurn = false;
  }

  var closePilgrim = 0;
  for( var i = 0; i < vars.visibleRobots.length; i++ ) {
    if( vars.visibleRobots[i].team == team )
      if( vars.visibleRobots[i].unit == vars.SPECS.PILGRIM )
        closePilgrim += 1;
  }

  var visibleEnemies = buildUtils.findVisibleEnemies.call(this);
  for (var i = 0; i < visibleEnemies.length; i++) {
    if (visibleEnemies[i][2] != vars.SPECS.PILGRIM)
      attackPos = [this.me.y+visibleEnemies[i][1], this.me.x+visibleEnemies[i][0]];
  }

  if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if (closePilgrim < deposits[0] && headcount[4] >= vars.CHURCH_MIN_DEF) {
      var buildLoc = buildUtils.buildOpt.call(this, attackPos, deposits, vars.SPECS.PILGRIM, this.me.x, this.me.y);
      //sendMessage.call(this, castleOrder, buildOptPil[i][1]**2+buildOptPil[i][0]**2);
      //this.log("Building pilgrim at "+x+" "+y);
      if( buildLoc != null ) {
        buildCount[2]++;
        vars.buildRobot = 2;
        return this.buildUnit(vars.SPECS.PILGRIM, buildLoc[1], buildLoc[0]);
      }
    }
  }

  // prophet build
  if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_FUEL)  {
    if (headcount[4] < vars.CHURCH_MAX_DEF) {
      var buildLoc = buildUtils.buildOpt.call(this, attackPos, deposits, vars.SPECS.PROPHET, this.me.x, this.me.y);
      if( buildLoc != null ) {
        buildCount[2]++;
        vars.buildRobot = 4;
        return this.buildUnit(vars.SPECS.PILGRIM, buildLoc[1], buildLoc[0]);
      }
    }
  }
}
