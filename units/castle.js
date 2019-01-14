import vars from '../variables';
import * as utils from '../utils';
import { sendMessage } from '../communication';

var team;
var totC = 0;
var myCastles = []; // in turn order, contains IDs and locations
var castleID = {};
var castleOrder = 0;
var teamID = {}; // hashmap stores info

var enemyCastles = [];
var curAttack = 0;
var symmetry;
var buildCount = [0,0,0,0,0,0];
var lastDeusVult = -10;
var deusVult = null;
var fullDV = true;

export default function castleTurn() {
  //this.log("I am a Castle at "+this.me.x+" "+this.me.y);

  if (vars.firstTurn) {
    symmetry = utils.checkMapSymmetry(vars.passableMap, vars.karbMap, vars.fuelMap);
    this.log("VERTICAL: " + symmetry[0] + "; HORIZONTAL: " + symmetry[1]);
    //Castle information, first turn only
    //determine total number of castles
    //determine if enemy castles are visible and number
    //  try to determine if map is truly horizontal or vertical if symmetry returned both
    team = this.me.team;
    for( var x = 0; x < vars.commRobots.length; x++ ) {
      if(vars.commRobots[x].team == team) {
        if (vars.commRobots[x].castle_talk==0) {
          totC++;
        }
        else {
          myCastles.push([vars.commRobots[x].id]);
          castleID[vars.commRobots[x].id] = 0;
          castleOrder++;
        }
      }
    }
    //this.log(enemyCastles);
    vars.firstTurn = false;
    //this.log("Test: " +vars.firstTurn);
  }

  // determines myCastles
  if (this.me.turn == 1) {
    for (var i = 0; i < castleOrder; i++) {
      myCastles[i] = [myCastles[i][0], [this.getRobot(myCastles[i][0]).castle_talk-128, 0]];
    }
    this.castleTalk(this.me.x+128);
    myCastles.push([this.me.id, [this.me.x, this.me.y]]);
  }
  if (this.me.turn == 2) {
    outer: for( var x = 0; x < vars.commRobots.length; x++ ) {
      if(vars.commRobots[x].team == team && vars.commRobots[x].castle_talk>=128) {
        for (var i = 0; i < myCastles.length; i++) {
          if (myCastles[i][0]==vars.commRobots[x].id) {
            continue outer;
          }
        }
        myCastles.push([vars.commRobots[x].id]);
      }
    }
    for (var i = 0; i < castleOrder; i++) {
      myCastles[i] = [myCastles[i][0], [myCastles[i][1][0], this.getRobot(myCastles[i][0]).castle_talk-128]];
    }
    for (var i = castleOrder+1; i < myCastles.length; i++) {
      myCastles[i] = [myCastles[i][0], [this.getRobot(myCastles[i][0]).castle_talk-128, 0]];
    }
    this.castleTalk(this.me.y+128);
  }
  if (this.me.turn == 3) {
    for (var i = castleOrder+1; i < myCastles.length; i++) {
      myCastles[i] = [myCastles[i][0], [myCastles[i][1][0], this.getRobot(myCastles[i][0]).castle_talk-128]];
    }
    if (symmetry[0]) {
      for (var i = 0; i < myCastles.length; i++) {
        enemyCastles.push([vars.xmax-1-myCastles[i][1][0], myCastles[i][1][1]]);
      }
    }
    if (symmetry[1]) {
      for (var i = 0; i < myCastles.length; i++) {
        enemyCastles.push([myCastles[i][1][0], vars.ymax-1-myCastles[i][1][1]]);
      }
    }
    this.log(vars.castleLocs);
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
  //this.log(this.me.turn);

  if (this.me.turn < 10 && headcount[2]<1 && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
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
  if(false && 3*buildCount[4] >= buildCount[5] && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_FUEL)  {
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
  if (castleOrder == 0 && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_FUEL)  {
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

  //this.log("attackers "+headcount[3]+headcount[4]+headcount[5]);
  if (this.me.turn-lastDeusVult>=100 || (this.me.turn-lastDeusVult >= 10 && headcount[3]+headcount[4]+headcount[5] >= 8 && this.fuel >= vars.CAMPDIST)) {
    this.log("DEUS VULT 0");
    deusVult = enemyCastles[curAttack%enemyCastles.length];
    //this.log(deusVult);
    sendMessage.call(this, 2**15+deusVult[0], vars.CAMPDIST);
    lastDeusVult = this.me.turn;
    fullDV = false;
    return;
  }
  while (!fullDV) {
    this.log("DEUS VULT 1");
    sendMessage.call(this, 2**15+deusVult[1], vars.CAMPDIST);
    fullDV = true;
    curAttack++;
  }
}
