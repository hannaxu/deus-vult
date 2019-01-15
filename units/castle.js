import vars from '../variables';
import * as utils from '../utils';
import { sendMessage } from '../communication';

var team;
var totC = 0;
var myCastles = []; // in turn order, contains IDs and locations
var castleID = {};
var castleOrder = 0;
var teamID = {}; // hashmap stores info
var symmetry;
var deposits = 0;

var enemyCastles = [];
var curAttack = 0;
var buildCount = [0,0,0,0,0,0];
var lastDeusVult = -10;
var deusVult = null;
var fullDV = true;
var deusVulters = {};

var defend = false;

export default function castleTurn() {
  //this.log("I am a Castle at "+this.me.x+" "+this.me.y);
  // utils.heapTest.call(this);
  // return;
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
          myCastles.push([vars.commRobots[x].id, [null, null]]);
          castleID[vars.commRobots[x].id] = 0;
          castleOrder++;
        }
      }
    }

    if (castleOrder == 2) {
      if (this.getRobot(myCastles[0][0]).castle_talk >= 128+64) {
        var temp = myCastles[0];
        myCastles[0] = myCastles[1];
        myCastles[1] = temp;
      }
    }

    //this.log(enemyCastles);
    //this.log("test");
    var lowX = this.me.x-5;
    var lowY = this.me.y-5;
    var highX = lowX+10;
    var highY = lowY+10;
    if( lowX < 0 ) lowX = 0;
    if( lowY < 0 ) lowY = 0;
    if( highX > vars.xmax ) highX = vars.xmax;
    if( highY > vars.ymax ) highY = vars.ymax;

    for (var x=lowX; x<highX; x++) {
      for (var y=lowY; y<highY; y++) {
        if (vars.fuelMap[y][x]) {
          deposits += 1;
        }
        if (vars.karbMap[y][x]) {
          deposits += 1;
        }
      }
    }
    this.log("nearby deposits: " + deposits);

    vars.firstTurn = false;
    //this.log("Test: " +vars.firstTurn);
  }

  // determines myCastles
  if (this.me.turn == 1) {
    for (var i = 0; i < castleOrder; i++) {
      myCastles[i][1][0] = this.getRobot(myCastles[i][0]).castle_talk-128-(i%2)*64;
    }
    this.castleTalk(this.me.x+128+64*(castleOrder%2));
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
        myCastles.push([vars.commRobots[x].id, [null, null]]);
      }
    }
    if (castleOrder==0&&myCastles.length==3) {
      if (this.getRobot(myCastles[2][0]).castle_talk >= 128+64) {
        var temp = myCastles[1];
        myCastles[1] = myCastles[2];
        myCastles[2] = temp;
      }
    }
    for (var i = 0; i < castleOrder; i++) {
      myCastles[i][1][1] = this.getRobot(myCastles[i][0]).castle_talk-128-64*(i%2);
    }
    for (var i = castleOrder+1; i < myCastles.length; i++) {
      myCastles[i][1][0] = this.getRobot(myCastles[i][0]).castle_talk-128-64*(i%2);
    }
    this.castleTalk(this.me.y+128+64*(castleOrder%2));
  }
  if (this.me.turn == 3) {
    for (var i = castleOrder+1; i < myCastles.length; i++) {
      myCastles[i][1][1] = this.getRobot(myCastles[i][0]).castle_talk-128-64*(i%2);
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
    this.log(myCastles);
    //this.log(vars.castleLocs);
  }

  // deletes dead enemyCastles
  for( var x = 0; x < vars.commRobots.length; x++ ) {
    if(deusVulters[vars.commRobots[x].id]!=null) {
      var message = vars.commRobots[x].castle_talk;
      if (message >= 64) {
        for (var i = 0; i < enemyCastles.length; i++) {
          if (enemyCastles[i]==deusVulters[vars.commRobots[x].id]) {
            this.log("deleted "+enemyCastles[i]);
            enemyCastles.splice(i, 1);
            if(curAttack > i) {
              curAttack--;
            }
            if (enemyCastles.length>0) {
              curAttack%=enemyCastles.length;
            }
          }
        }
      }
    }
  }

  //headcount 0: castle, 1: church, 2: pilgrim, 3: crusader, 4: prophet, 5: preacher
  var headcount = [1,0,0,0,0,0];
  var enemyUnit = 0;
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
    else
      enemyUnit += 1;
  }
  //this.log(this.me.turn);
  if( enemyUnit > 0 ) {
    defend = true;
    //this.log("defend");
  }
  else {
    defend = false;
  }

  var closePilgrim = 0;
  for( var i = 0; i < vars.visibleRobots.length; i++ ) {
    if( vars.visibleRobots[i].team == team )
      if( vars.visibleRobots[i].unit == vars.SPECS.PILGRIM )
        closePilgrim += 1;
  }


  //if (!defend && (closePilgrim < deposits&&headcount[2]<2) && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
  if (!defend && headcount[2]<1 && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
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
  if ((castleOrder == 0 || defend) && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_FUEL)  {
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
    deusVult = enemyCastles[curAttack];
    //this.log(deusVult);
    sendMessage.call(this, 2**15+deusVult[0], vars.CAMPDIST);
    for (var i = 0; i < vars.visibleRobots.length; i++) {
      var dx = this.me.x-vars.visibleRobots[i].x;
      var dy = this.me.y-vars.visibleRobots[i].y;
      if (dx**2+dy**2<=vars.CAMPDIST) {
        deusVulters[vars.visibleRobots[i].id] = enemyCastles[curAttack];
      }
    }
    //this.log(deusVulters);
    lastDeusVult = this.me.turn;
    fullDV = false;
    return;
  }
  while (!fullDV) {
    this.log("DEUS VULT "+enemyCastles[curAttack]);
    sendMessage.call(this, 2**15+2**14+deusVult[1], vars.CAMPDIST);
    fullDV = true;
    curAttack = (curAttack+1)%enemyCastles.length;
  }
}
