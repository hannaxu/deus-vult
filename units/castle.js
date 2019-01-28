import vars from '../variables';
import * as utils from '../utils';
import { sendMessage, castleLocComm, trackUnits, castleLocSend } from '../communication';
import * as buildUtils from '../buildUtils';

var team;
var myCastles = {}; // contains locations
var myCastlesAlive = [];  // list of booleans in turn order
var castleOrderAll = [];  // ids in order
var castleOrder = 0;
var totalCastles;
var teamID = {}; // hashmap stores info
var deposits = [0,[],[]]; //total, karb locs, fuel locs
var buildCount = [0,0,0,0,0,0];
var attackPos = null;

var unitTracking = {};
var untracked = new Set();

var enemyCastles = []; // enemyCastle locations based on our castleLocations in turn order
var enemyCastlesAlive = []; // list of booleans in turn order (not matched to enemyCastles!)
var curAttack = 0; // next enemyCastle to deusVult
var lastDeusVult = -10; // last turn since deusVult
var deusVult = null; // where to attack
var deusVulters = {}; // robots currently deusVulting and their target deusVult
var attackerCount = 0; // how many of our damaging troops in vision
var farthestAttacker = 0; // r^2 distance of our farthest attacker
var visionPilgrims = 0;

var trackMap = []; // [id, unit]
var trackRobots = {}; // trackRobots[id] = [pos, unit]

var churchLoc = 0;
var churched = false;
var attackPosEarly;


export default function castleTurn() {
  vars.buildRobot = 0;
  if (this.me.team==0&&this.me.turn%25==0&&castleOrder==0) {
    this.log("Castle Round "+this.me.turn);
  }
  //this.log("I am a Castle at "+this.me.x+" "+this.me.y);
  // utils.heapTest.call(this);
  // return;
  if (this.me.turn==1) {
    this.log("VERTICAL: " + vars.symmetry[0] + "; HORIZONTAL: " + vars.symmetry[1]);

    team = this.me.team;

    if (vars.symmetry[0]) {
      attackPosEarly = [this.me.y, vars.xmax-1-this.me.x];
    }
    else {
      attackPosEarly = [this.me.x, vars.ymax-1-this.me.y];
    }

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

  if( this.me.turn == 3 ) {
    churchLoc = buildUtils.churchLoc.call(this, castleOrderAll, castleOrder, enemyCastles, myCastles, vars.ymax*vars.ymax);
  }

  // communicate castleLocs
  // only the first two turns
  var prims = [totalCastles, castleOrder];
  var val = castleLocComm.call(this, myCastles, castleOrderAll, unitTracking, prims, addEnemyCastle);
  totalCastles = prims[0];
  castleOrder = prims[1];
  if(this.me.turn == 1){
    myCastlesAlive = Array(totalCastles).fill(true);
    enemyCastlesAlive = Array(totalCastles).fill(true);
  }
  if(typeof(val) != 'undefined')
    return val;

  // track units
  var ret = trackUnits.call(this, unitTracking, untracked, totalCastles, deleteEnemyCastle);
  var buildDisable = false;
  if(ret != null){
    unitTracking = ret[0];
    var churching = ret[1];
    var builtRobot = ret[2];
    if(builtRobot != null){
      var message1 = castleLocSend.call(this, 1, myCastles, castleOrderAll, myCastlesAlive, enemyCastlesAlive);
      sendMessage.call(this, message1, (this.me.x-builtRobot.x)**2 + (this.me.y-builtRobot.y)**2);
      buildDisable = true;
    }
  }
  //if(buildDisable) this.log("I AM DISABLED");

  if(false && this.me.turn % 250 == 0 && castleOrder == 0){
    this.log(unitTracking);
    this.log([...untracked]);
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
  }

  var visibleCount = [1,0,0,0,0,0];
  for( var i = 0; i < vars.visibleRobots.length; i++ ) {
    if( vars.visibleRobots[i].team == team ) {
      var u = vars.visibleRobots[i].unit;
      if( u == vars.SPECS.CASTLE )
        visibleCount[0] += 1;
      else if( u == vars.SPECS.CHURCH )
        visibleCount[1] += 1;
      else if( u == vars.SPECS.PILGRIM )
        visibleCount[2] += 1;
      else if( u == vars.SPECS.CRUSADER )
        visibleCount[3] += 1;
      else if( u == vars.SPECS.PROPHET )
        visibleCount[4] += 1;
      else if( u == vars.SPECS.PREACHER )
        visibleCount[5] += 1;
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
  var defend = false;
  if( enemyUnit > 0 ) {
    defend = true;
    this.log("defend");
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

  //var churching = castletalk with pilgrim
  /*if( churching && !churched ) {
    churchLoc--;
    churched = true;
  }
  if( !churching )
    churched = false;*/
  //this.log(churchLoc);

  if (!buildDisable && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    var test = buildUtils.buildPilgrim.call(this, defend, churchLoc, churching, visibleCount, deposits);
    if( test || test == null ) {
      var buildLoc = buildUtils.buildOpt.call(this, attackPos, deposits, vars.SPECS.PILGRIM, this.me.x, this.me.y);
      if( buildLoc != null ) {
        //this.log(buildLoc);
        if(test == null)
          churchLoc--;
        buildCount[2]++;
        vars.buildRobot = 2;
        temp.call(this, buildLoc[1], buildLoc[0]);
        return this.buildUnit(vars.SPECS.PILGRIM, buildLoc[1], buildLoc[0]);
      }
    }
  }

  // preacher build
  if(false && !buildDisable && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PREACHER].CONSTRUCTION_FUEL)  {
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
        //sendMessage.call(this, castleOrder, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
        //this.log("Building pilgrim at "+x+" "+y);
        buildCount[5]++;
        vars.buildRobot = 5;
        temp.call(this, vars.buildable[i][0], vars.buildable[i][1]);
        return this.buildUnit(vars.SPECS.PREACHER, vars.buildable[i][0], vars.buildable[i][1]);
      }
    }
  }

  // prophet build
  if (!buildDisable && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_FUEL)  {
    if ( buildUtils.buildProphet.call(this, defend, churchLoc, castleOrder, visibleCount, castleOrderAll, myCastles, unitTracking) ) {
      var buildLoc;
      if( attackPos == null && this.me.turn < 15 ) 
        buildLoc = buildUtils.buildOpt.call(this, attackPosEarly, deposits, vars.SPECS.PROPHET, this.me.x, this.me.y);
      else
        buildLoc = buildUtils.buildOpt.call(this, attackPos, deposits, vars.SPECS.PROPHET, this.me.x, this.me.y);
      if( buildLoc != null ) {
        //this.log(buildLoc);
        buildCount[4]++;
        vars.buildRobot = 4;
        temp.call(this, buildLoc[1], buildLoc[0]);
        return this.buildUnit(vars.SPECS.PROPHET, buildLoc[1], buildLoc[0]);
      }
    }
  }

  //attacker pilgrims
  if (false && !buildDisable && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if (headcount[4] >= vars.MIN_ATK_ROBOTS-2 && visionPilgrims < 3) {
      for (var i = 0; i < vars.buildable.length; i++) {
        var x = this.me.x+vars.buildable[i][0];
        var y = this.me.y+vars.buildable[i][1];
        if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
          sendMessage.call(this, 1 << 14, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
          //this.log("Building pilgrim at "+x+" "+y);
          buildCount[2]++;
          vars.buildRobot = 2;
          temp.call(this, vars.buildable[i][0], vars.buildable[i][1]);
          return this.buildUnit(vars.SPECS.PILGRIM, vars.buildable[i][0], vars.buildable[i][1]);
        }
      }
    }
  }

  // Send signal to let other castles know I'm protected
  if (attackerCount >= vars.MIN_ATK_ROBOTS) {
    vars.CastleTalk.performOptional(1);
  }

  var allProtected = true;
  for(var i in castleOrderAll){
    var id = castleOrderAll[i];
    if(id in unitTracking){
      myCastlesAlive[i] = true;
      var actions = vars.CastleTalk.receive(unitTracking[id].castle_talk, vars.SPECS.CASTLE);
      if(actions.opt == 0){
        allProtected = false;
        break;
      }
    }
    else{
      myCastlesAlive[i] = false;
    }
  }
  if(allProtected){
    if(castleOrder == 0){
      //this.log("All Castles Protected");
    }
    //TODO: Deus Vult
  }

  // DEUS VULTING
  if (this.fuel >= vars.MIN_ATK_FUEL && enemyCastles.length > 0 && this.me.turn%50==0) {
    if (attackerCount >= vars.MIN_ATK_ROBOTS) {
      curAttack = parseInt(this.me.turn/50)%enemyCastles.length;
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

function attackPhase () {
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

function addEnemyCastle(myCastleLoc) {
  if (vars.symmetry[0]) {
      enemyCastles.push([vars.xmax-1-myCastleLoc[0], myCastleLoc[1]]);
  }
  if (vars.symmetry[1]) {
      enemyCastles.push([myCastleLoc[0], vars.ymax-1-myCastleLoc[1]]);
  }
}

function deleteEnemyCastle(id) {
  if(deusVulters[id] != null) {
    // deletes dead enemyCastles
    var j = 0;
    for (var i = 0; i < enemyCastles.length; i++) {
      if (!enemyCastlesAlive[j])
        j++;
      if (enemyCastles[i]==deusVulters[id]) {
        this.log("CASTLEKILL: Killed enemy castle at " + enemyCastles[i]);
        enemyCastles.splice(i, 1);
        enemyCastlesAlive[j] = false;
        if(curAttack > i) {
          curAttack--;
        }
        if (enemyCastles.length>0) {
          curAttack%=enemyCastles.length;
        }
      }
      j++;
    }
    delete deusVulters[id];
  }
  else {
    this.log("CASTLEKILL: Unit " + id + " is not DEUSVULTing");
  }
}

function temp(dx, dy){
  var message0 = castleLocSend.call(this, 0, myCastles, castleOrderAll, myCastlesAlive, enemyCastlesAlive);
  sendMessage.call(this, message0, dx**2 + dy**2);
}