import { BCAbstractRobot, SPECS } from 'battlecode';

import vars from './variables';

import castleTurn from './castle';
import crusaderTurn from './crusader';
import pilgrimTurn from './pilgrim';

import * as utils from './utils';

class MyRobot extends BCAbstractRobot {
  constructor () {
    super();
    vars.SPECS = SPECS;
  }

  turn () {
    try {
      vars.visibleRobotMap = this.getVisibleRobotMap();
      vars.xpos = this.me.x;
      vars.ypos = this.me.y;

      if (vars.firstTurn) {
        vars.firstTurn = false;
        vars.passableMap = this.getPassableMap();
        vars.karbMap = this.getKarboniteMap();
        vars.fuelMap = this.getFuelMap();
        vars.xmax = vars.passableMap.length;
        vars.ymax = vars.passableMap[0].length;

        vars.moveRadius = vars.SPECS.UNITS[this.me.unit].SPEED;
        vars.attackRadius = vars.SPECS.UNITS[this.me.unit].ATTACK_RADIUS;
        vars.buildRadius = 2;
        vars.sightRadius = vars.SPECS.UNITS[this.me.unit].VISION_RADIUS;
        vars.attackCost = vars.SPECS.UNITS[this.me.unit].ATTACK_FUEL_COST;
        vars.moveCost = vars.SPECS.UNITS[this.me.unit].FUEL_PER_MOVE;

        if(this.me.unit==vars.SPECS.CASTLE) {
            var symmetry = utils.checkMapSymmetry(vars.passableMap, vars.karbMap, vars.fuelMap);
            this.log("VERTICAL: " + symmetry[0] + "; HORIZONTAL: " + symmetry[1]);
        }

        for (var x = 1; x <= Math.sqrt(vars.moveRadius); x++) {
          for (var y = 0; y <= Math.sqrt(vars.moveRadius); y++) {
            if (x*x+y*y <= vars.moveRadius) {
              vars.moveable.push([x, y]);
              vars.moveable.push([-x, -y]);
              vars.moveable.push([-x, y]);
              vars.moveable.push([x, -y]);
            }
          }
        }

        for (var x = 1; x <= Math.sqrt(vars.buildRadius); x++) {
          for (var y = 0; y <= Math.sqrt(vars.buildRadius); y++) {
            if (x*x+y*y <= vars.buildRadius) {
              vars.buildable.push([x, y]);
              vars.buildable.push([-x, -y]);
              vars.buildable.push([-x, y]);
              vars.buildable.push([x, -y]);
            }
          }
        }

        for (var x = 0; x < vars.xmax; x++) {
          vars.fuzzyCost.push([]);
          for (var y = 0; y < vars.ymax; y++) {
            vars.fuzzyCost[x].push([]);
          }
        }

        if (this.me.unit!=vars.SPECS.CASTLE) {
          for (var i = 0; i < vars.buildable.length; i++) {
            var x = this.me.x+vars.buildable[i][0];
            var y = this.me.y+vars.buildable[i][1];
            if (!this.checkBounds(x, y)) continue;
            var id = this.getRobot(vars.visibleRobotMap[y][x]);
            if (id==null) continue;
            var xsig = Math.floor(id.signal/100);
            var ysig = id.signal%100;
            if (id.unit==vars.SPECS.CASTLE&&xsig==this.me.x&&ysig==this.me.y) {
              vars.creatorPos = [x, y];
            }
          }
          this.log("Created by "+vars.creatorPos);
        }
        vars.firstTurn = false;
      // end of init
      }
      // if (!this.firstTurn) return;
      // this.firstTurn = false;

      switch (this.me.unit) {
        case vars.SPECS.PILGRIM:
          return this.pilgrimTurn();
        case vars.SPECS.CRUSADER:
          return this.crusaderTurn();
        case vars.SPECS.CASTLE:
          return this.castleTurn();
      }
    }
    catch (err) {
      this.log("Error "+err);
    }
  }

  checkBounds(x, y) {
    return 0 <= x && x < vars.xmax && 0 <= y && y < vars.ymax;
  }

  findMove(start, end) {
    if (vars.fuzzyCost[end[0]][end[1]].length==0) {
      for (var x = 0; x < vars.xmax; x++) {
        vars.fuzzyCost[end[0]][end[1]].push([]);
        for (var y = 0; y < vars.ymax; y++) {
          vars.fuzzyCost[end[0]][end[1]][x].push(null);
        }
      }
      this.bfs(end);
    }
    var bestMove = [vars.POS_INF, vars.POS_INF, null];
    for (var i = 0; i < vars.moveable.length; i++) {
      var x = this.me.x+vars.moveable[i][0];
      var y = this.me.y+vars.moveable[i][1];
      if (this.checkBounds(x, y)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
        var move = vars.fuzzyCost[end[0]][end[1]][x][y];
        if (move[0]<bestMove[0]) {
          bestMove = [move[0], move[1], vars.moveable[i]];
        }
        else if(move[0]==bestMove[0]&&move[1]<bestMove[0]) {
          bestMove = [move[0], move[1], vars.moveable[i]];
        }
      }
    }
    return bestMove[2];
  }

  bfs (end) {
    var index = 0;
    var queue = [];
    queue.push(end);
    vars.fuzzyCost[end[0]][end[1]][end[0]][end[1]] = [0, 0];
    while (index<queue.length) {
      //this.log("q "+queue[index]);
      var curCost = vars.fuzzyCost[end[0]][end[1]][queue[index][0]][queue[index][1]];
      for (var i = 0; i < vars.moveable.length; i++) {
        var x = queue[index][0]+vars.moveable[i][0];
        var y = queue[index][1]+vars.moveable[i][1];
        if (this.checkBounds(x, y)&&vars.passableMap[y][x]&&vars.fuzzyCost[end[0]][end[1]][x][y]==null) {
          queue.push([x, y]);
          vars.fuzzyCost[end[0]][end[1]][x][y] = [curCost[0]+1, curCost[1]+vars.moveCost*(vars.moveable[i][0]**2+vars.moveable[i][1]**2)];
        }
      }
      index++;
    }
  }


}

MyRobot.prototype.castleTurn = castleTurn;
MyRobot.prototype.crusaderTurn = crusaderTurn;
MyRobot.prototype.pilgrimTurn = pilgrimTurn;

var robot = new MyRobot();
