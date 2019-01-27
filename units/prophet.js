import vars from '../variables';
import * as utils from '../utils';
import { sendMessage, sendMessageTrusted, readMessages, cypherMessage } from '../communication';

var enemyCastles = [];
var symmetry = [false, false];
var deusVult = null;
var deusVultTiles = null;
var curPath = [];

export default function prophetTurn() {
  // this.log("I am a Prophet at "+vars.xpos+" "+vars.ypos);
  if (this.me.turn==1) {

  }

  // check for DEUS VULT signal
  if (deusVult==null) {
    var creator = this.getRobot(vars.creatorID);
    if (creator!=null&&this.isRadioing(creator)) {
      var message = cypherMessage(creator.signal, this.me.team);
      if ((message & 2**15)>0) {
        var stayDistance = (message%(1<<15))>>12;
        var dist = (this.me.x-vars.creatorPos[0])**2+(this.me.y-vars.creatorPos[1])**2;
        if (dist>stayDistance) {
          //this.log("Deus Vult received");
          deusVult = utils.unhashCoordinates(message%(1<<12));
          deusVultTiles = [];
          for (var i = 0; i < vars.attackable.length; i++) {
            var x = deusVult[0]+vars.attackable[i][0];
            var y = deusVult[1]+vars.attackable[i][1];
            if (utils.checkBounds(x, y)&&vars.passableMap[y][x]) {
              deusVultTiles.push([x, y]);
            }
          }
        }
      }
    }
  }

  // checks if enemy castle is already dead
  if (deusVult!=null) {
    var id = vars.visibleRobotMap[deusVult[1]][deusVult[0]];
    if (id==0||(id>0&&this.getRobot(id).unit!=vars.SPECS.CASTLE)) {
      deusVult = null;
      this.castleTalk(64);
    }
  }

  // attacking
  if (this.fuel >= vars.attackCost) {
    var attackableEnemies = utils.findAttackableEnemies.call(this);
    if (attackableEnemies.length>0) {
      var dir = [attackableEnemies[0].x-this.me.x, attackableEnemies[0].y-this.me.y];
      return this.attack(dir[0], dir[1])
    }
  }

  if (vars.creatorPos==null)
    return;

  // moving
  if (this.fuel >= vars.moveCost*vars.moveRadius) {

    // basic kiting
    if (vars.dangerTiles[utils.hashCoordinates[this.me.x, this.me.y]]!=null) {
      this.log("In danger");
      var saferPos = [];
      for (var i = 0; i < vars.moveable.length; i++) {
        var x = this.me.x+vars.moveable[i][0];
        var y = this.me.y+vars.moveable[i][1];
        var empty = utils.checkBounds(x, y)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]<=0;
        if (empty && vars.dangerTiles[utils.hashCoordinates([x, y])]==null) {
          curPath = [];
          return this.move(vars.moveable[i][0], vars.moveable[i][1]);
        }
      }
    }

    // continues moving along the current path
    if (curPath.length>0) {
      var move = curPath.splice(0, 1)[0];
      if (vars.visibleRobotMap[this.me.y+move[1]][this.me.x+move[0]] == 0) {
        return this.move(move[0], move[1])
      }
      curPath = [];
    }

    if (deusVult!=null) {
      if (this.me.time>1.2*vars.NAVIGATION_TIME_LIMIT) {
        var curDist = (this.me.x-deusVult[0])**2+(this.me.y-deusVult[1])**2;
        if (vars.attackRadius[0] > curDist || curDist > vars.attackRadius[1]) {
          var path = utils.navigate.call(this, [this.me.x, this.me.y], deusVultTiles, vars.ATTACK_DEPTH);
          if (path!=null) {
            var move = path.splice(0, 1)[0];
            curPath = path;
            return this.move(move[0], move[1]);
          }
        }
      }
      var x = deusVult[0];
      var y = deusVult[1];
      var id = vars.visibleRobotMap[y][x];
      // check if already dead
      var move = utils.findMoveD.call(this, [this.me.x, this.me.y], deusVult);
      if (move != null) {
        //this.log("Moving towards "+x+" "+y);
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

      if (this.me.time>1.2*vars.NAVIGATION_TIME_LIMIT) {
        var path = utils.navigate.call(this, [this.me.x, this.me.y], betterPos, vars.DEFENSE_DEPTH);
        if (path!=null) {
          //this.log(path);
          var move = path.splice(0, 1)[0];
          curPath = path;
          //this.castleTalk(utils.connIndexOf(vars.moveable, move));
          return this.move(move[0], move[1]);
        }
      }
    }
  }
}
