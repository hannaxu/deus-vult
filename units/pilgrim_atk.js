import vars from '../variables';
import * as utils from '../utils';
import { sendMessage, sendMessageTrusted, readMessages, cypherMessage } from '../communication';

var deusVult = null;
var deusVultFrom = null;
var curPath = [];

export function pilgrimAtkTurn() {
  // this.log("I am an Attacker Pilgrim at "+vars.xpos+" "+vars.ypos);
  if (this.me.turn==1) {

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

  // moving
  if (this.fuel >= vars.moveCost*vars.moveRadius) {

    // IMPLEMENT LATER get in range of enemies
    /*
    var damageLoc = {};
    for (var i = 0; i < vars.visibleEnemyRobots.length; i++) {
        var u = vars.visibleRobots[i].unit;
        if (3 <= u && u <= 5) {
          var dx = vars.visibleRobots[i].x-this.me.x;
          var dy = vars.visibleRobots[i].y-this.me.y;
          if (dx**2+dy**2 < vars.attackRadius[0]) {
            this.log(1);
          }
        }
    }
    */
    if (curPath.length>0) {
      var move = curPath.splice(0, 1)[0];
      if (vars.visibleRobotMap[this.me.y+move[1]][this.me.x+move[0]] == 0) {
        vars.CastleTalk.performAction('move', {'dxdy': move});
        return this.move(move[0], move[1])
      }
      curPath = [];
    }

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
        //this.castleTalk(utils.connIndexOf(vars.moveable, move));
        vars.CastleTalk.performAction('move', {'dxdy': move});
        return this.move(move[0], move[1]);
      }
    }
    else {
      // archer lattice
      var betterPos = [];
      var curDist = (this.me.x-vars.creatorPos[0])**2+(this.me.y-vars.creatorPos[1])**2;
      // minimum distance AND on even tile AND not on resource tile
      var alreadyOk = vars.MIN_LAT_DIST < curDist && utils.onLattice(this.me.x, this.me.y) && !vars.fuelMap[this.me.y][this.me.x] && !vars.karbMap[this.me.y][this.me.x];
      for (var i = 0; i < vars.visible.length; i++) {
        var x = this.me.x+vars.visible[i][0];
        var y = this.me.y+vars.visible[i][1];
        var newDist = (x-vars.creatorPos[0])**2+(y-vars.creatorPos[1])**2;
        // robust addition
        var empty = utils.checkBounds(x, y)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]<=0;
        var onLattice = utils.onLattice(x, y);
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

      var path = utils.navigate.call(this, [this.me.x, this.me.y], betterPos, vars.DEFENSE_DEPTH);
      if (path!=null) {
        //this.log(path);
        var move = path.splice(0, 1)[0];
        curPath = path;
        //this.castleTalk(utils.connIndexOf(vars.moveable, move));
        vars.CastleTalk.performAction('move', {'dxdy': move});
        return this.move(move[0], move[1]);
      }
    }
  }
}
