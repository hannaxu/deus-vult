import vars from '../variables';
import * as utils from '../utils';
import { sendMessage } from '../communication';
import * as buildUtils from '../buildUtils';

var buildCount = [0,0,0,0,0,0];
var team;
var deposits = [0,[],[]]; //total, karb locs, fuel locs
var attackPos = null;
var churchLoc = 1;

export default function churchTurn() {
  //this.log("I am a Church at "+this.me.x+" "+this.me.y);
  //this.log("Resources: "+this.karbonite+" "+this.fuel);
  if (this.me.turn == 1) {
    team = this.me.team;
    deposits = buildUtils.resources.call(this, this.me.x, this.me.y);
    //this.log(deposits[0]);
  }

  //last minute church building
  if(false && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if (vars.isLastTurn) {
      for (var i = 0; i < vars.buildable.length; i++) {
        var x = this.me.x+vars.buildable[i][0];
        var y = this.me.y+vars.buildable[i][1];
        if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
          //sendMessage.call(this, castleOrder, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
          this.log("Last minute pilgrim building at "+x+" "+y);
          return this.buildUnit(vars.SPECS.PILGRIM, vars.buildable[i][0], vars.buildable[i][1]);
        }
      }
    }
  }

  //headcount 0: castle, 1: church, 2: pilgrim, 3: crusader, 4: prophet, 5: preacher
  var headcount = [0,1,0,0,0,0];
  var enemyUnit = 0;
  for( var i = 0; i < vars.visibleRobots.length; i++ ) {
    if( vars.visibleRobots[i].team == team ) {
      var u = vars.visibleRobots[i].unit;
      if( u == vars.SPECS.CASTLE )
        headcount[0] += 1;
      else if( u == vars.SPECS.CHURCH )
        headcount[1] += 1;
      else if( u == vars.SPECS.PILGRIM )
        headcount[2] += 1;
      else if( u == vars.SPECS.CRUSADER )
        headcount[3] += 1;
      else if( u == vars.SPECS.PROPHET )
        headcount[4] += 1;
      else if( u == vars.SPECS.PREACHER )
        headcount[5] += 1;
    }
    else {
      enemyUnit += 1;
    }
  }
  var defend = false;
  if( enemyUnit > 0 )
    defend = true;

  var visibleEnemies = buildUtils.findVisibleEnemies.call(this);
  for (var i = 0; i < visibleEnemies.length; i++) {
    //if (visibleEnemies[i][2] != vars.SPECS.PILGRIM)
    attackPos = [this.me.y+visibleEnemies[i][1], this.me.x+visibleEnemies[i][0]];
  }

  //this.log("WHAT");
  //this.log(churchLoc);

  if (!defend && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if ((headcount[2] < deposits[0] && headcount[4] >= vars.CHURCH_MIN_DEF) || headcount[2] < deposits[1].length || (churchLoc > 0 && headcount[2] >= deposits[0])) {
      var buildLoc = buildUtils.buildOpt.call(this, attackPos, deposits, vars.SPECS.PILGRIM, this.me.x, this.me.y);
      if( buildLoc != null ) {
        if( churchLoc > 0 )
          churchLoc--;
        buildCount[2]++;
        vars.buildRobot = 2;
        return this.buildUnit(vars.SPECS.PILGRIM, buildLoc[1], buildLoc[0]);
      }
    }
  }

 if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.CRUSADER].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.CRUSADER].CONSTRUCTION_FUEL)  {
    if ( defend && headcount[3] < 1 ) {
      var buildLoc = buildUtils.buildOpt.call(this, attackPos, deposits, vars.SPECS.CRUSADER, this.me.x, this.me.y);
      if( buildLoc != null ) {
        buildCount[3]++;
        vars.buildRobot = 3;
        return this.buildUnit(vars.SPECS.CRUSADER, buildLoc[1], buildLoc[0]);
      }
    }
  }

  // prophet build
  if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_FUEL)  {
    if ((defend && this.karbonite > 50) || headcount[4] < vars.CHURCH_MIN_DEF || (headcount[4] < vars.CHURCH_MAX_DEF && this.karbonite > 150)) {
      var buildLoc = buildUtils.buildOpt.call(this, attackPos, deposits, vars.SPECS.PROPHET, this.me.x, this.me.y);
      if( buildLoc != null ) {
        buildCount[4]++;
        vars.buildRobot = 4;
        return this.buildUnit(vars.SPECS.PROPHET, buildLoc[1], buildLoc[0]);
      }
    }
  }
}
