import vars from '../variables';
import * as utils from '../utils';
import { sendMessage } from '../communication';

var team;
var myCastles = []; // in turn order, contains IDs and locations
var castleOrder = 0;
var totalCastles;
var teamID = {}; // hashmap stores info
var symmetry;
var deposits = 0;
var buildCount = [0,0,0,0,0,0];

var unitTracking = {};
var untracked = new Set();

var enemyCastles = []; // enemyCastle locations based on our castleLocations
var curAttack = 0; // next enemyCastle to deusVult
var lastDeusVult = -10; // last turn since deusVult
var deusVult = null; // where to attack
var deusVulters = {}; // robots currently deusVulting and their target deusVult
var attackerCount = 0; // how many of our damaging troops in vision
var farthestAttacker = 0; // r^2 distance of our farthest attacker

var temp = new Set();

export default function castleTurn() {
  if (this.me.team==0 && castleOrder == 0) {
    this.log("Round "+this.me.turn);
  }
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

  // communicate castleLocs
  // only the first two turns
  var val = castleLocComm.call(this);
  if(typeof(val) != 'undefined')
    return val;

  // track units
  trackUnits.call(this);

  // // deletes dead enemyCastles
  // for( var x = 0; x < vars.commRobots.length; x++ ) {
  //   if(deusVulters[vars.commRobots[x].id]!=null) {
  //     var message = vars.commRobots[x].castle_talk;
  //     if (message >= 64) {
  //       for (var i = 0; i < enemyCastles.length; i++) {
  //         if (enemyCastles[i]==deusVulters[vars.commRobots[x].id]) {
  //           this.log("deleted "+enemyCastles[i]);
  //           enemyCastles.splice(i, 1);
  //           if(curAttack > i) {
  //             curAttack--;
  //           }
  //           if (enemyCastles.length>0) {
  //             curAttack%=enemyCastles.length;
  //           }
  //         }
  //       }
  //       delete deusVulters[vars.commRobots[x].id];
  //     }
  //   }
  // }

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
    //this.log("defend");
  }

  var closePilgrim = 0;
  for( var i = 0; i < vars.visibleRobots.length; i++ ) {
    if( vars.visibleRobots[i].team == team )
      if( vars.visibleRobots[i].unit == vars.SPECS.PILGRIM )
        closePilgrim += 1;
  }


  //if (!defend && (headcount[2]<1 || (headcount[2]<3 && this.me.turn > 10 && closePilgrim < deposits && castleOrder != 0)) && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
  if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if (!defend && (headcount[2]<1 || (headcount[4] > 4 && this.me.turn > 10 && closePilgrim < deposits))) {
      for (var i = 0; i < vars.buildable.length; i++) {
        var x = this.me.x+vars.buildable[i][0];
        var y = this.me.y+vars.buildable[i][1];
        if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
          sendMessage.call(this, i, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
          //this.log("Building pilgrim at "+x+" "+y);
          buildCount[2]++;
          vars.CastleTalk.performAction('build', {'dxdy': [vars.buildable[i][0], vars.buildable[i][1]], 'unit':vars.SPECS.PILGRIM});
          return this.buildUnit(vars.SPECS.PILGRIM, vars.buildable[i][0], vars.buildable[i][1]);
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
        vars.CastleTalk.performAction('build', {'dxdy': [vars.buildable[i][0], vars.buildable[i][1]], 'unit':vars.SPECS.PREACHER});
        return this.buildUnit(vars.SPECS.PREACHER, vars.buildable[i][0], vars.buildable[i][1]);
      }
    }
  }

  // prophet build
  if ((castleOrder == 0 || this.me.turn > 10) && headcount[4] < 20 && this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PROPHET].CONSTRUCTION_FUEL)  {
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
        vars.CastleTalk.performAction('build', {'dxdy': [vars.buildable[i][0], vars.buildable[i][1]], 'unit':vars.SPECS.PROPHET});
        return this.buildUnit(vars.SPECS.PROPHET, vars.buildable[i][0], vars.buildable[i][1]);
      }
    }
  }

  //this.log("attackers "+headcount[3]+headcount[4]+headcount[5]);
  if (enemyCastles.length > 0 && this.me.turn-lastDeusVult >= 20 && attackerCount >= vars.MIN_ATK && this.fuel >= vars.CAMPDIST) {
    this.log("DEUS VULT "+enemyCastles[curAttack]);
    deusVult = enemyCastles[curAttack];
    //this.log(deusVult);
    sendMessage.call(this, 2**15+utils.hashCoordinates(deusVult), vars.CAMPDIST);
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


  // Communicate castle locations
  // use proposeTrade (for now) to avoid castleTalk collisions
  // send only during first
  // receive during first and second
  function castleLocComm() {
    if(this.me.turn == 1) {
      totalCastles = vars.commRobots.length;
      //this.log("There are " + totalCastles + " total castles");

      for(var i = 0; i < vars.commRobots.length; i++) {
        var other_r = vars.commRobots[i];
        if(other_r.turn == this.me.turn) {
            if(other_r.id != this.me.id ) {
            castleOrder++;
            // read other information
            readInfo.call(this, other_r);
          }
        }
        else{
          // to later tell which ones are castles
          temp.add(parseInt(other_r.id));
        }
      }
      myCastles[castleOrder] = [this.me.id, [this.me.x, this.me.y]];
      startTracking(this.me, this.me.x, this.me.y, this.me.unit);
      //this.log("I am castle " + castleOrder);
      if(totalCastles - castleOrder == 1)
        this.log(myCastles);

      if(totalCastles > 1){
        // send my information
        this.castleTalk(castleOrder << 6 | this.me.x);
        var k = Math.abs(this.last_offer[this.me.team][0]);
        var f = Math.abs(this.last_offer[this.me.team][1]);
        if(castleOrder == 1)
          f = 2**4-1<<6 | this.me.y;
        else
          k = 2**4-1<<6 | this.me.y;
        if(this.me.team == vars.SPECS.RED)
          return this.proposeTrade(-k, -f);
        else
          return this.proposeTrade(k, f);
      }
    }

    else if(this.me.turn == 2){
      for(var i = 0; i < vars.commRobots.length; i++) {
        var other_r = vars.commRobots[i];
        if(temp.has(other_r.id)) {
          // read other information
          readInfo.call(this, other_r);
        }
      }
      if(totalCastles - castleOrder > 1)
        this.log(myCastles);
    }
  }

  function readInfo(other_r){
    var order = other_r.castle_talk >> 6;
    var x = other_r.castle_talk & 63;
    var y = Math.abs(this.last_offer[this.me.team][order&1]) & (2**6-1);
    myCastles[order] = [other_r.id, [x, y]];
    startTracking(other_r, x, y, vars.SPECS.CASTLE);
  }
  function startTracking(other_r, x, y, unit){
    unitTracking[other_r.id] = {type:"robot", id:other_r.id, turn:other_r.turn,
      team:team, unit:unit, x:x, y:y, fuel:0, karbonite:0,
      signal:other_r.signal, signal_radius:other_r.signal_radius, castle_talk:other_r.castle_talk}
  }

  function trackUnits(){
    if(this.me.turn == 1)
      return;
    
    var appeared = [];
    var built = [];

    for(var i in vars.commRobots){
      var other_r = vars.commRobots[i];
      
      if(other_r.id in unitTracking){
        // prevent castleLoc messages from messing with unit tracking
        if(this.me.turn == 2 && totalCastles > 1 && (other_r.turn < 2 || other_r.id == this.me.id))
          continue;

        // unit currently tracked
        unitTracking[other_r.id].turn = other_r.turn;
        unitTracking[other_r.id].signal = other_r.signal;
        unitTracking[other_r.id].signal_radius = other_r.signal_radius;
        unitTracking[other_r.id].castle_talk = other_r.castle_talk;
  
        // receive updates
        try{
          var actions = vars.CastleTalk.receive(other_r.castle_talk, unitTracking[other_r.id].unit);
          for(var name in actions){
            switch(name){
              case "move":
                if(utils.checkBounds(unitTracking[other_r.id].x + actions[name].dxdy[0],
                  unitTracking[other_r.id].y + actions[name].dxdy[1])){
                  unitTracking[other_r.id].x += actions[name].dxdy[0];
                  unitTracking[other_r.id].y += actions[name].dxdy[1];
                }
                else
                  this.log("UTRACK: Attempted to move " + other_r.id + " off of the map.")
                break;
              case "build":
                var info = [actions[name].unit,
                  unitTracking[other_r.id].x + actions[name].dxdy[0],
                  unitTracking[other_r.id].y + actions[name].dxdy[1]
                ];
                if(utils.checkBounds(info[1], info[2]))
                  built.push(info);
                else
                  this.log("UTRACK: Attempted to build by " + other_r.id + " outside the map.")
                break;
              case "mine":
                if(vars.karbMap[unitTracking[other_r.id].y][unitTracking[other_r.id].x])
                  unitTracking[other_r.id].karbonite += 2;
                else if(vars.fuelMap[unitTracking[other_r.id].y][unitTracking[other_r.id].x])
                  unitTracking[other_r.id].fuel += 10;
                else{this.log(unitTracking[other_r.id]);
                  this.log("UTRACK: Location " + unitTracking[other_r.id].x + ", " + unitTracking[other_r.id].y + " is not mineable.");
                }break;
              case "give":
                //TODO: giving
                break;
            }
          }
        }
        catch(err){
          this.log("UTRACK: Failed when tracking " + other_r.id + " at (" + other_r.x + ", " + other_r.y + ")");
          this.log(err.toString());
        }
      }
  
      else if(other_r.team == team){
        if(!untracked.has(other_r.id)){
          appeared.push(other_r);
        }
      }
    }


    // add any visible
    var toRemove = new Set();
    for(var i in appeared){
      var other_r = appeared[i];
      if(this.isVisible(other_r)){
        var dxdy = [0, 0];
        if(other_r.turn > 0){
          var actions = vars.CastleTalk.receive(other_r.castle_talk, other_r.unit);
          if('move' in actions)
            dxdy = actions.move.dxdy;
        }
        var idx = built.findIndex(function(loc){
          return loc[1] == (other_r.x-dxdy[0]) &&
            loc[2] == (other_r.y-dxdy[1]);
        });
        if(idx == -1)
          this.log("UTRACK: No matching build job found for visible unit " + other_r.id);
        else{
          // found build job
          //this.log("UTRACK: Tracking unit " + other_r.id + " at (" + other_r.x + ", " + other_r.y + ")");
          startTracking(other_r, other_r.x, other_r.y, other_r.unit);
        }
        built.splice(idx, 1);
        toRemove.add(parseInt(i));
      }
    }
    appeared = appeared.filter(function(_, i){
      return !toRemove.has(i);
    })
    // match built units with appeared
    switch(built.length){
      case 0:
        break;
      case 1:
        if(appeared.length == 0)
          this.log("UTRACK: No matching unit found for build at " + built[0][1] + ", " + built[0][2]);
        else{
          if(appeared[0].turn > 0){
            var actions = vars.CastleTalk.receive(appeared[0].castle_talk, built[0][0]);
            if('move' in actions){
              built[0][1] += actions.move.dxdy[0];
              built[0][2] += actions.move.dxdy[1];
            }
          }
          //this.log("UTRACK: Tracking unit " + appeared[0].id + " at (" + built[0][1] + ", " + built[0][2] + ")");
          startTracking(appeared[0], built[0][1], built[0][2], built[0][0]);
        }
        break;
      default:
        this.log("UTRACK: Ambiguous builds detected. Units not matched.");
        for(var i in appeared){
          var other_r = appeared[i];
          untracked.add(parseInt(other_r.id));
        }
    }

    if(false && this.me.turn % 250 == 0){
      this.log(unitTracking);
      this.log([...untracked]);
    }
  }
}
