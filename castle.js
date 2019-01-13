import vars from './variables';
import * as utils from './utils';
import { sendMessage } from './communication';

var team;
var totC;

var enemyCastles = [];
var symmetry;
var buildCount = [0,0,0,0,0,0];

export default function castleTurn() {
  //this.log("I am a Castle at "+this.me.x+" "+this.me.y);
  //this.log("Resources: "+vars.firstTurn);
  if (vars.firstTurn) {
    symmetry = utils.checkMapSymmetry(vars.passableMap, vars.karbMap, vars.fuelMap);
    this.log("VERTICAL: " + symmetry[0] + "; HORIZONTAL: " + symmetry[1]);
    //Castle information, first turn only
    //determine total number of castles
    //determine if enemy castles are visible and number
    //  try to determine if map is truly horizontal or vertical if symmetry returned both
    team = this.me.team;
    totC = vars.commRobots.length;
    for( var x = 0; x < totC; x++ ) {
      if( vars.commRobots[x].team != team ) {
        totC = totC-1;
      }
    }
    if (symmetry[0]) {
      enemyCastles.push(vars.xmax-1-this.me.x, this.me.y);
    }
    if (symmetry[1]) {
      enemyCastles.push([this.me.x, vars.ymax-1-this.me.y]);
    }
    //this.log(enemyCastles);
    vars.firstTurn = false;
    //this.log("Test: " +vars.firstTurn);
  }

  //headcount 0: castle, 1: church, 2: pilgrim, 3: crusader, 4: prophet, 5: preacher
  var headcount = [1,0,0,0,0,0];
  for( var i = 0; i < vars.commRobots.length; i++ ) {
    if( vars.commRobots[i].team == team ) {
      var u = vars.commRobots[i].unit;
      if( u == vars.SPECS.CASTLE )
        headcount[0] += 1;
      if( u == vars.SPECS.CHURCH )
        headcount[1] += 1;
      if( u == vars.SPECS.PILGRIM )
        headcount[2] += 1;
      if( u == vars.SPECS.CRUSADER )
        headcount[3] += 1;
      if( u == vars.SPECS.PROPHET )
        headcount[4] += 1;
      if( u == vars.SPECS.PREACHER )
        headcount[5] += 1;
    }
  }

  if (headcount[2]<1 && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
        sendMessage.call(this, i, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
        //this.log("Building pilgrim at "+x+" "+y);
        buildCount[2]++;
        return this.buildUnit(vars.SPECS.PILGRIM, vars.buildable[i][0], vars.buildable[i][1]);
      }
    }
  }

  // preacher build
  if(2*buildCount[4] >= buildCount[5] && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_FUEL)  {
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
        var message = i;
        if (symmetry[0]) {
          message += vars.buildable.length;
        }
        if (symmetry[1]) {
          message += vars.buildable.length*2;
        }
        sendMessage.call(this, message, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
        //this.log("Building pilgrim at "+x+" "+y);
        buildCount[5]++;
        return this.buildUnit(vars.SPECS.PREACHER, vars.buildable[i][0], vars.buildable[i][1]);
      }
    }
  }

  // prophet build
  if(this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_FUEL)  {
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
        var message = i;
        if (symmetry[0]) {
          message += vars.buildable.length;
        }
        if (symmetry[1]) {
          message += vars.buildable.length*2;
        }
        sendMessage.call(this, message, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
        //this.log("Building pilgrim at "+x+" "+y);
        buildCount[4]++;
        return this.buildUnit(vars.SPECS.PROPHET, vars.buildable[i][0], vars.buildable[i][1]);
      }
    }
  }
}
