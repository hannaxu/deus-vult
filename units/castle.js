import vars from '../variables';
import * as utils from '../utils';
import { sendMessage } from '../communication';
import * as buildUtils from '../buildUtils';

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
var attackPos = null;

var enemyCastles = []; // enemyCastle locations based on our castleLocations
var curAttack = 0; // next enemyCastle to deusVult
var lastDeusVult = -10; // last turn since deusVult
var deusVult = null; // where to attack
var deusVulters = {}; // robots currently deusVulting and their target deusVult
var attackerCount = 0; // how many of our damaging troops in vision
var farthestAttacker = 0; // r^2 distance of our farthest attacker
var visionPilgrims = 0;

var trackMap = []; // [id, unit]
var trackRobots = {}; // trackRobots[id] = [pos, unit]

var builtChurch = false;
var leastDepo = false;


export default function castleTurn() {
  vars.buildRobot = 0;
  if (this.me.team==0&&this.me.turn%25==0) {
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
    //this.log("totC "+totC)

    //this.log(enemyCastles);
    //this.log("test");
    //this.log("help1");
    deposits = buildUtils.resources.call(this, this.me.x, this.me.y);
    //for( var i = 0; i < castl)
    //this.log("help");
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
    this.log("My castles:");
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
    var min = deposits[0];
    for( var c in myCastles ) {
      min = Math.min(min, buildUtils.resources.call(this, myCastles[c][0], myCastles[c][1])[0]);
    }
    if( min == deposits[0] ) {
      leastDepo = true;
    }
  }

  // deletes dead enemyCastles
  for( var x = 0; x < vars.commRobots.length; x++ ) {
    if(deusVulters[vars.commRobots[x].id]!=null) {
      var message = vars.commRobots[x].castle_talk;
      if (message >= 64) {
        for (var i = 0; i < enemyCastles.length; i++) {
          if (enemyCastles[i]==deusVulters[vars.commRobots[x].id]) {
            this.log("Killed enemy castle at "+enemyCastles[i]);
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

  var attackDir = attackPhase.call(this);
  if (attackDir!=null) {
    return this.attack(attackDir[0], attackDir[1]);
  }

  var visibleEnemies = buildUtils.findVisibleEnemies.call(this);
  for (var i = 0; i < visibleEnemies.length; i++) {
    if (visibleEnemies[i][2] != vars.SPECS.PILGRIM)
      attackPos = [this.me.y+visibleEnemies[i][1], this.me.x+visibleEnemies[i][0]];
  }

  //if (!defend && (headcount[2]<1 || (headcount[2]<3 && this.me.turn > 10 && closePilgrim < deposits && castleOrder != 0)) && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
  if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if ( !defend && (( headcount[2]<deposits[0] || (headcount[4] > 2 && closePilgrim < Math.min(deposits[1].length+1, deposits[0])) ) || (leastDepo && (closePilgrim < deposits[0] || builtChurch == false))) ) {
      var buildLoc = buildUtils.buildOpt.call(this, attackPos, deposits, vars.SPECS.PILGRIM, this.me.x, this.me.y);
      //sendMessage.call(this, castleOrder, buildOptPil[i][1]**2+buildOptPil[i][0]**2);
      //this.log("Building pilgrim at "+x+" "+y);
      if( buildLoc != null ) {
        if( leastDepo && !builtChurch && closePilgrim == deposits[0])
          builtChurch = true;
        //this.log(buildLoc);
        buildCount[2]++;
        vars.buildRobot = 2;
        return this.buildUnit(vars.SPECS.PILGRIM, buildLoc[1], buildLoc[0]);
      }
    }
  }

  // preacher build
  if(false && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_FUEL)  {
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
        //sendMessage.call(this, castleOrder, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
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
      var buildLoc = buildUtils.buildOpt.call(this, attackPos, deposits, vars.SPECS.PROPHET, this.me.x, this.me.y);
      //sendMessage.call(this, castleOrder, buildOptPil[i][1]**2+buildOptPil[i][0]**2);
      //this.log("Building pilgrim at "+x+" "+y);
      if( buildLoc != null ) {
        //this.log(buildLoc);
        buildCount[4]++;
        vars.buildRobot = 4;
        return this.buildUnit(vars.SPECS.PROPHET, buildLoc[1], buildLoc[0]);
      }
    }
  }

  //attacker pilgrims
  if (false && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if (headcount[4] >= vars.MIN_ATK_ROBOTS-2 && visionPilgrims < 3) {
      for (var i = 0; i < vars.buildable.length; i++) {
        var x = this.me.x+vars.buildable[i][0];
        var y = this.me.y+vars.buildable[i][1];
        if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
          sendMessage.call(this, 1 << 14, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
          //this.log("Building pilgrim at "+x+" "+y);
          buildCount[2]++;
          vars.buildRobot = 2;
          return this.buildUnit(vars.SPECS.PILGRIM, vars.buildable[i][0], vars.buildable[i][1]);
        }
      }
    }
  }

  // DEUS VULTING
  if (this.fuel >= vars.MIN_ATK_FUEL && enemyCastles.length > 0 && this.me.turn%50==0) {
    if (attackerCount >= vars.MIN_ATK_ROBOTS) {
      curAttack = (this.me.turn/50)%enemyCastles.length;
      this.log("DEUS VULT "+enemyCastles[curAttack]);
      deusVult = enemyCastles[curAttack];
      //this.log(deusVult);
      var stayDistance = 0; // robots within this radius will remain on defense
      var curDefenders = 0;
      for (var i = 0; i < vars.visible.length; i++) {
        var x = this.me.x+vars.visible[i][0];
        var y = this.me.y+vars.visible[i][1];
        if (!utils.checkBounds(x, y)) continue;
        var robot = this.getRobot(vars.visibleRobotMap[y][x]);
        if (robot!=null && robot.team==this.me.team && robot.unit >= 3) {
          curDefenders++;
        }
        if (curDefenders > vars.CASTLE_MIN_DEF) {
          stayDistance = Math.min(7, vars.visible[i][0]**2+vars.visible[i][1]**2-1);
          this.log("Stay distance "+stayDistance);
          break;
        }
      }

      sendMessage.call(this, 2**15+(stayDistance<<12)+utils.hashCoordinates(deusVult), vars.visionRadius);
      for (var i = 0; i < vars.visibleRobots.length; i++) {
        var dx = this.me.x-vars.visibleRobots[i].x;
        var dy = this.me.y-vars.visibleRobots[i].y;
        if (dx**2+dy**2<=farthestAttacker&&deusVulters[vars.visibleRobots[i].id]==null) {
          deusVulters[vars.visibleRobots[i].id] = enemyCastles[curAttack];
        }
      }
      //this.log(deusVulters);
      lastDeusVult = this.me.turn;
      return;
    }
  }
}

export function attackPhase () {
  if (this.fuel < 10) {
    return null;
  }
  if (this.karbonite >= vars.SPECS.UNITS[4]) {
    return null;
  }
  var attackableEnemies = utils.findAttackableEnemies.call(this);
  if (attackableEnemies.length>0) {
      return [attackableEnemies[0].x-this.me.x, attackableEnemies[0].y-this.me.y];
    }
}
