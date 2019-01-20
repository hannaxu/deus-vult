import vars from '../variables';
import * as utils from '../utils';
import { sendMessage, sendMessageTrusted, readMessages, cypherMessage } from '../communication';

var enemyCastles = [];
var symmetry = [false, false];
var deusVult = null; // boolean for whether or not in attack phase
var deusVultFrom = null;

export default function preacherTurn() {
  //this.log("I am a Preacher at "+vars.xpos+" "+vars.ypos);
  if (vars.firstTurn) {
    var creator = this.getRobot(vars.visibleRobotMap[vars.creatorPos[1]][vars.creatorPos[0]]);
    var message = Math.floor(cypherMessage(creator.signal, this.me.team)/8);
    if (message%2==1) {
      symmetry[0] = true;
    }
    if (Math.floor(message/2)==1) {
      symmetry[1] = true;
    }
    if (symmetry[0]) {
      enemyCastles.push([vars.xmax-1-vars.creatorPos[0], vars.creatorPos[1]]);
    }
    if (symmetry[1]) {
      enemyCastles.push([vars.creatorPos[0], vars.ymax-1-vars.creatorPos[1]]);
    }
    vars.firstTurn = false;
  }

  // check for DEUS VULT signal
  if (deusVult==null) {
    outer: for (var i = 0; i < vars.visibleRobots.length; i++) {
      if (!this.isRadioing(vars.visibleRobots[i])||this.me.team!=vars.visibleRobots[i].team) {
        continue;
      }
      var pos = [vars.visibleRobots.x, vars.visibleRobots.y];
      if (vars.visibleRobots[i].unit==0) {
        var message = cypherMessage(vars.visibleRobots[i].signal, this.me.team);
        if ((message & 2**15)>0) {
          //this.log("DEUS VULT 0 RECEIVED");
          deusVultFrom = vars.visibleRobots[i].id;
          deusVult = utils.unhashCoordinates(message-2**15);
          break outer;
        }
      }
    }
  }

  // attacking
  if (this.fuel >= vars.attackCost) {
    var bestDir = null;
    var maxHit = vars.NEG_INF;
    for (var i = 0; i < vars.attackable.length; i++) {
      var x = this.me.x+vars.attackable[i][0];
      var y = this.me.y+vars.attackable[i][1];
      var dx = vars.attackable[i][0];
      var dy = vars.attackable[i][1];
      if (utils.checkBounds(x, y)&&vars.passableMap[y][x]) {
        var hit = 0;
        var damaging = false;
        vars.buildable.push([0, 0]);
        for (var j = 0; j < vars.buildable.length; j++) {
          var xhit = x+vars.buildable[j][0];
          var yhit = y+vars.buildable[j][1];
          if (!utils.checkBounds(xhit, yhit)) {
            continue;
          }
          var id = vars.visibleRobotMap[yhit][xhit];
          if (id>0) {
            if (this.getRobot(id).team==this.me.team) {
              hit--;
            }
            else {
              hit++;
              damaging = true;
            }
          }
        }
        vars.buildable.splice(8, 1);
        //this.log(hit);
        if (damaging && hit > maxHit) {
          bestDir = [dx, dy];
          maxHit = hit;
        }
      }
    }
    if (bestDir!=null&&maxHit>=0) {
      //this.log("Attacking "+(this.me.x+bestDir[0])+" "+(this.me.y+bestDir[1]));
      return this.attack(bestDir[0], bestDir[1]);
    }
  }

  if (vars.creatorPos==null)
    return;

  // moving
  if (this.fuel >= vars.moveCost*vars.moveRadius) {

    // IMPLEMENT LATER get in range of enemies
    // var damageLoc = {};
    // for (var i = 0; i < vars.visibleEnemyRobots.length; i++) {
    //     var u = vars.visibleRobots[i].unit;
    //     if (3 <= u && u <= 5) {
    //
    //     }
    // }

    // DEUS VULT, attack deusVult
    if (deusVult!=null) {
      var x = deusVult[0];
      var y = deusVult[1];
      var id = vars.visibleRobotMap[y][x];
      // check if already dead
      if (id==0||(id>0&&this.getRobot(id).unit!=vars.SPECS.CASTLE)) {
        deusVult = null;
        deusVultFrom = null;
        this.castleTalk(64);
        return;
      }
      var move = utils.findMoveD.call(this, [this.me.x, this.me.y], deusVult);
      if (move != null) {
        //this.log("Moving towards "+x+" "+y);
        vars.CastleTalk.performAction('move', {'dxdy': move});
        return this.move(move[0], move[1]);
      }
    }
    else {
      // archer lattice
      var betterPos = [];
      var curDist = (this.me.x-vars.creatorPos[0])**2+(this.me.y-vars.creatorPos[1])**2;
      // minimum distance AND on even tile AND not on resource tile
      var alreadyOk = vars.MIN_LAT_DIST < curDist && (this.me.x+this.me.y)%2==0 && !vars.fuelMap[this.me.y][this.me.x] && !vars.karbMap[this.me.y][this.me.x];
      for (var i = 0; i < vars.visible.length; i++) {
        var x = this.me.x+vars.visible[i][0];
        var y = this.me.y+vars.visible[i][1];
        var newDist = (x-vars.creatorPos[0])**2+(y-vars.creatorPos[1])**2;
        // robust addition
        var empty = utils.checkBounds(x, y)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]<=0;
        var onLattice = (x+y)%2==0;
        if (!empty || !onLattice || newDist <= vars.MIN_LAT_DIST) {
          continue;
        }
        var onResource = vars.fuelMap[y][x]||vars.karbMap[y][x];
        if (onResource) {
          continue;
        }
        if (alreadyOk && curDist <= newDist) {
          continue;
        }
        betterPos.push([x, y]);
      }
      betterPos.sort(function (v1, v2) {
        var d1 = (v1[0]-vars.creatorPos[0])**2+(v1[1]-vars.creatorPos[1])**2;
        var d2 = (v2[0]-vars.creatorPos[0])**2+(v2[1]-vars.creatorPos[1])**2;
        return d1-d2;
      });
      // this.log("betterPos");
      // this.log(betterPos);

      var paths = utils.astar.call(this, [this.me.x, this.me.y], betterPos, 5);
      // this.log("paths");
      // this.log(paths);
      for (var i = 0; i < betterPos.length; i++) {
        var path = paths[utils.hashCoordinates(betterPos[i])];
        if (path!=null&&path.length>0) {
          // this.log(this.me.x+" "+this.me.y+" to "+betterPos[i][0]+" "+betterPos[i][1]);
          // this.log(path);
          vars.CastleTalk.performAction('move', {'dxdy': path[0]});
          return this.move(path[0][0], path[0][1]);
        }
      }


      // goes to creatorPos if not deusVult
      // if ((this.me.x-vars.creatorPos[0])**2+(this.me.y-vars.creatorPos[1])**2 > vars.CAMPDIST) {
      //   var move = utils.findMoveD.call(this, [this.me.x, this.me.y], vars.creatorPos);
      //   if (move != null) {
      //     vars.CastleTalk.performAction('move', {'dxdy': move});
      //     return this.move(move[0], move[1]);
      //   }
      // }

      // defend in direction of enemies
      // var x = enemyCastles[0][0];
      // var y = enemyCastles[0][1];
      // var id = vars.visibleRobotMap[y][x];
      // var curDist = (this.me.x-vars.creatorPos[0])**2+(this.me.y-vars.creatorPos[1])**2;
      // var newDist = (x-vars.creatorPos[0])**2+(y-vars.creatorPos[1])**2;
      // var move = utils.findMoveD.call(this, [this.me.x, this.me.y], enemyCastles[0]);
      // if (move != null&&curDist < newDist && newDist <= vars.CAMPDIST) {
      //   //this.log("Moving towards "+x+" "+y);
      //   vars.CastleTalk.performAction('move', {'dxdy': move});
      //   return this.move(move[0], move[1]);
      // }
    }
  }
}
