import vars from '../variables';
import * as utils from '../utils';
import { sendMessage } from '../communication';

var team;
var totC = 1;
var myCastles = {}; // contains locations
var castleOrder = 0;
var teamID = {}; // hashmap stores info
var symmetry;
var deposits = [0,[],[]]; //total, karb locs, fuel locs
var buildCount = [0,0,0,0,0,0];
var buildOptPil = []; //pilgrims,
var buildOptUnit = []; //units

var enemyCastles = []; // enemyCastle locations based on our castleLocations
var curAttack = 0; // next enemyCastle to deusVult
var lastDeusVult = -10; // last turn since deusVult
var deusVult = null; // where to attack
var deusVulters = {}; // robots currently deusVulting and their target deusVult
var attackerCount = 0; // how many of our damaging troops in vision
var farthestAttacker = 0; // r^2 distance of our farthest attacker

var trackMap = []; // [id, unit]
var trackRobots = {}; // trackRobots[id] = [pos, unit]

export default function castleTurn() {
  vars.buildRobot = 0;
  if (this.me.team==0) {
    this.log("Castle Round "+this.me.turn);
  }
  //this.log("I am a Castle at "+this.me.x+" "+this.me.y);
  // utils.heapTest.call(this);
  // return;
  if (this.me.turn==1) {
    symmetry = utils.checkMapSymmetry(vars.passableMap, vars.karbMap, vars.fuelMap);
    this.log("VERTICAL: " + symmetry[0] + "; HORIZONTAL: " + symmetry[1]);
    //Castle information, first turn only
    //determine total number of castles
    //determine if enemy castles are visible and number
    //  try to determine if map is truly horizontal or vertical if symmetry returned both
    team = this.me.team;
    for(var i = 0; i < vars.castleTalkRobots.length; i++) {
      totC++;
      if (vars.castleTalkRobots[i].castle_talk == 0) continue;
      if ((vars.castleTalkRobots[i].castle_talk & (1<<6)) > 0) {
        totC--;
      }
      castleOrder++;
    }
    // this.log("co "+castleOrder)
    // this.log("totC "+totC)

    //this.log(enemyCastles);
    //this.log("test");

    //resource consideration
    //this.log("hello");
    var di = 1;
    var dj = 0;
    var seg = 1;
    var i = this.me.x;
    var j = this.me.y;
    var segPass = 0;
    for (var k = 0; k < 100; ++k) {
      if( !(i < 0 || j < 0 || i >= vars.xmax || j >= vars.ymax) ) {
        if (vars.karbMap[j][i]) {
          deposits[0] += 1;
          deposits[1].push([j,i]);
        }
        if (vars.fuelMap[j][i]) {
          deposits[0] += 1;
          deposits[2].push([j,i]);
        }
      }
      i += di;
      j += dj;
      ++segPass;
      if (segPass == seg) {
        segPass = 0;
        var temp = di;
        di = -dj;
        dj = temp;
        if (dj == 0)
            ++seg;
      }
    }
    //this.log("hel");
    function transferPt(coor, mx, my) {
      var y = coor[0]-my;
      if( y != 0 ) y = y/Math.abs(y);
      var x = coor[1]-mx;
      if( x != 0 ) x = x/Math.abs(x);
      return [y, x];
    }

    for(var i = 0; i < deposits[1].length; i++) {
      buildOptPil.push(transferPt(deposits[1][i], this.me.x, this.me.y));
    }
    for(var i = 0; i < deposits[2].length; i++) {
      buildOptPil.push(transferPt(deposits[2][i], this.me.x, this.me.y));
    }
    buildOptPil = buildOptPil.concat(vars.buildable);

    this.log("nearby deposits: " + buildOptPil);

    // tracking robots
    for (var x = 0; x < vars.xmax; x++) {
      trackMap.push([]);
      for (var y = 0; y < vars.ymax; y++) {
        trackMap[x].push(null);
      }
    }
    trackMap[this.me.y][this.me.x] = [this.me.id, this.me.unit];
  }

  // determines myCastles
  if (this.me.turn<=3) {
    for (var i = 0; i < vars.castleTalkRobots.length; i++) {
      var robot = vars.castleTalkRobots[i];
      if ((robot.id!=this.me.id && robot.castle_talk&(1<<7)) > 0) {
        if (robot.turn==1) {
          myCastles[robot.id] = [robot.castle_talk % (1<<6), null];
        }
        if (robot.turn==2) {
          myCastles[robot.id][1] = robot.castle_talk % (1<<6);
        }
      }
    }
    myCastles[this.me.id] = [this.me.x, this.me.y];
  }

  if (this.me.turn==3) {
    this.log(myCastles);
    if (symmetry[0]) {
      for (var c in myCastles) {
        enemyCastles.push([vars.xmax-1-myCastles[c][0], myCastles[c][1]]);
      }
    }
    if (symmetry[1]) {
      for (var c in myCastles) {
        enemyCastles.push([myCastles[c][0], vars.ymax-1-myCastles[c][1]]);
      }
    }
  }

  // tracks moving robots BROKEN
  // for (var i = 0; i < vars.castleTalkRobots.length; i++) {
  //   var robot = vars.castleTalkRobots[i];
  //   var message = robot.castle_talk % (1<<6);
  //   if (robot.unit < 2) continue;
  //   if (trackRobots[robot.id] != null) {
  //     var u = trackRobots[robot.id][1];
  //     var move = utils.findConnections(vars.SPECS.UNITS[u].MOVERADIUS)[message];
  //     if (trackMap[trackRobots[robot.id][0][0]][trackRobots[robot.id][0][1]]==robot.id) {
  //       trackMap[trackRobots[robot.id][0][0]][trackRobots[robot.id][0][1]] = 0;
  //     }
  //     trackRobots[robot.id][0][0] = utils.add(trackRobots[robot.id][0], move);
  //     trackMap[trackRobots[robot.id][0][0]][trackRobots[robot.id][0][1]] = robot.id;
  //   }
  // }
  //
  // for (var i = 0; i < vars.visibleRobots.length; i++) {
  //   var robot = vars.visibleRobots[i];
  //   if (robot.team==this.me.team) {
  //     trackRobots[robot.id] = [[robot.x, robot.y], robot.unit];
  //     trackMap[robot.y][robot.x] = robot.id;
  //   }
  // }
  // this.log("track");
  // this.log(trackRobots);

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
        delete deusVulters[vars.commRobots[x].id];
      }
    }
  }

  attackerCount = 0;
  farthestAttacker = 0;
  // updates attacker stats
  for (var i = 0; i < vars.visibleRobots.length; i++) {
    if (vars.visibleRobots[i].team==team) {
      var u = vars.visibleRobots[i].unit;
      if (3 <= u && u <= 5) {
        attackerCount++;
        farthestAttacker = Math.max(farthestAttacker, (vars.visibleRobots[i].x-this.me.x)**2+(vars.visibleRobots[i].y-this.me.y)**2);
      }
    }
  }
  // this.log("attackerCount "+attackerCount);
  // this.log("farthestAttacker "+farthestAttacker)

  //headcount 0: castle, 1: church, 2: pilgrim, 3: crusader, 4: prophet, 5: preacher
  var headcount = [1,0,0,0,0,0];
  var enemyUnit = 0;
  for( var i = 0; i < vars.commRobots.length; i++ ) {
    if( vars.commRobots[i].team == team ) {
      var u = vars.commRobots[i].unit;
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
      if( u == vars.SPECS.CRUSADER )
        enemyUnit += 1;
      else if( u == vars.SPECS.PROPHET )
        enemyUnit += 1;
      else if( u == vars.SPECS.PREACHER )
        enemyUnit += 1;
    }
  }
  //this.log(this.me.turn);
  var defend = false;
  if( enemyUnit > 0 ) {
    defend = true;
    this.log("defend");
  }

  var closePilgrim = 0;
  for( var i = 0; i < vars.visibleRobots.length; i++ ) {
    if( vars.visibleRobots[i].team == team )
      if( vars.visibleRobots[i].unit == vars.SPECS.PILGRIM )
        closePilgrim += 1;
  }

  if (this.fuel >= vars.attackCost) {
    var bestDir = null;
    for (var i = 0; i < vars.visibleEnemyRobots.length; i++) {
      if( vars.visibleEnemyRobots[i].unit == 2 || (this.karb >= 25 && this.fuel >= 50) )
        continue;
      var x = vars.visibleEnemyRobots[i].x;
      var y = vars.visibleEnemyRobots[i].y;
      var dx = x-this.me.x;
      var dy = y-this.me.y;
      if (vars.attackRadius[0]<=dx**2+dy**2&&dx**2+dy**2<=vars.attackRadius[1]) {
        if (bestDir==null||dx**2+dy**2 < bestDir[0]**2+bestDir[1]**2) {
          bestDir = [dx, dy];
        }
      }
    }
    if (bestDir!=null) {
      this.log("Attacking "+(this.me.x+bestDir[0])+" "+(this.me.y+bestDir[1]));
      return this.attack(bestDir[0], bestDir[1]);
    }
  }

  //if (!defend && (headcount[2]<1 || (headcount[2]<3 && this.me.turn > 10 && closePilgrim < deposits && castleOrder != 0)) && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
  if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if ( !defend && ( headcount[2]<1 || (headcount[4] > 3 && this.me.turn > 10 && closePilgrim < Math.min(deposits[1].length+1, deposits[0])) ) ) {
      for (var i = 0; i < buildOptPil.length; i++) {
        var x = this.me.x+buildOptPil[i][1];
        var y = this.me.y+buildOptPil[i][0];
        if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
          sendMessage.call(this, castleOrder, buildOptPil[i][1]**2+buildOptPil[i][0]**2);
          //this.log("Building pilgrim at "+x+" "+y);
          buildCount[2]++;
          vars.buildRobot = 2;
          return this.buildUnit(vars.SPECS.PILGRIM, buildOptPil[i][1], buildOptPil[i][0]);
        }
      }
    }
  }

  // preacher build
  if(false && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_FUEL)  {
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
        sendMessage.call(this, castleOrder, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
        //this.log("Building pilgrim at "+x+" "+y);
        buildCount[5]++;
        vars.buildRobot = 5;
        return this.buildUnit(vars.SPECS.PREACHER, vars.buildable[i][0], vars.buildable[i][1]);
      }
    }
  }

  // prophet build
  if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_FUEL)  {
    if ( ((castleOrder == 0 || this.me.turn > 10) && headcount[4] < 20) || (this.karbonite >= 100 && this.fuel >= 300)) {
      for (var i = 0; i < vars.buildable.length; i++) {
        var x = this.me.x+vars.buildable[i][0];
        var y = this.me.y+vars.buildable[i][1];
        if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
          sendMessage.call(this, castleOrder, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
          //this.log("Building pilgrim at "+x+" "+y);
          buildCount[4]++;
          vars.buildRobot = 4;
          return this.buildUnit(vars.SPECS.PROPHET, vars.buildable[i][0], vars.buildable[i][1]);
        }
      }
    }
  }

  //this.log("attackers "+headcount[3]+headcount[4]+headcount[5]);
  if (this.me.turn%200==0 || enemyCastles.length > 0 && this.me.turn-lastDeusVult >= 20 && attackerCount >= vars.MIN_ATK && this.fuel >= vars.CAMPDIST) {
    this.log("DEUS VULT "+enemyCastles[curAttack]);
    deusVult = enemyCastles[curAttack];
    //this.log(deusVult);
    sendMessage.call(this, 2**15+utils.hashCoordinates(deusVult), 100);
    for (var i = 0; i < vars.visibleRobots.length; i++) {
      var dx = this.me.x-vars.visibleRobots[i].x;
      var dy = this.me.y-vars.visibleRobots[i].y;
      if (dx**2+dy**2<=farthestAttacker&&deusVulters[vars.visibleRobots[i].id]==null) {
        deusVulters[vars.visibleRobots[i].id] = enemyCastles[curAttack];
      }
    }
    //this.log(deusVulters);
    lastDeusVult = this.me.turn;
    curAttack = (curAttack+1)%enemyCastles.length;
    return;
  }
}
