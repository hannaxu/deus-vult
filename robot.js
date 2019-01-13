import { BCAbstractRobot, SPECS } from 'battlecode';

import vars from './variables';

import castleTurn from './castle';
import crusaderTurn from './crusader';
import pilgrimTurn from './pilgrim';
import churchTurn from './church';
import prophetTurn from './prophet';
import preacherTurn from './preacher';

import * as utils from './utils';
import { sendMessage, sendMessageTrusted, readMessages, cypherMessage } from './communication';

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
        vars.teamFuel=this.fuel;

      if (vars.firstTurn) {


        vars.passableMap = this.map;
        vars.karbMap = this.getKarboniteMap();
        vars.fuelMap = this.getFuelMap();
        vars.ymax = vars.passableMap.length;
        vars.xmax = vars.passableMap[0].length;
        vars.moveRadius = vars.SPECS.UNITS[this.me.unit].SPEED;
        vars.attackRadius = vars.SPECS.UNITS[this.me.unit].ATTACK_RADIUS;
        vars.buildRadius = 2;
        vars.visionRadius = vars.SPECS.UNITS[this.me.unit].VISION_RADIUS;
        vars.attackCost = vars.SPECS.UNITS[this.me.unit].ATTACK_FUEL_COST;
        vars.moveCost = vars.SPECS.UNITS[this.me.unit].FUEL_PER_MOVE;
          vars.maxKarb = vars.SPECS.UNITS[this.me.unit].KARBONITE_CAPACITY;
          vars.maxFuel = vars.SPECS.UNITS[this.me.unit].FUEL_CAPACITY;
          utils.initRecList();

        vars.visible = utils.findConnections.call(this, vars.visionRadius);
        if (vars.attackRadius!=null) {
          var temp = utils.findConnections.call(this, vars.attackRadius[1]);
          for (var i = 0; i < temp.length; i++) {
            if (temp[i][0]**2+temp[i][1]**2 >= vars.attackRadius[0]) {
              vars.attackable.push(temp[i]);
            }
          }
        }
        vars.moveable = utils.findConnections.call(this, vars.moveRadius);
        vars.buildable = utils.findConnections.call(this, vars.buildRadius);

        for (var x = 0; x < vars.xmax; x++) {
          vars.fuzzyCost.push([]);
          for (var y = 0; y < vars.ymax; y++) {
            vars.fuzzyCost[x].push([]);
          }
        }
          //this.log("low init");
        if (this.me.unit!=vars.SPECS.CASTLE) {
          for (var i = 0; i < vars.buildable.length; i++) {
            var x = this.me.x+vars.buildable[i][0];
            var y = this.me.y+vars.buildable[i][1];
            if (!this.checkBounds(x, y)) continue;
            var id = this.getRobot(vars.visibleRobotMap[y][x]);
            if (id==null||id.signal==-1||(id.unit!=vars.SPECS.CASTLE&&id.unit!=vars.SPECS.CHURCH)) continue;
            var dir = vars.buildable[cypherMessage(id.signal, this.me.team)%vars.buildable.length];
              //this.log(dir+"");
            var correctSignal = dir[0]==-vars.buildable[i][0]&&dir[1]==-vars.buildable[i][1];
            if (correctSignal) {
              vars.creatorPos = [x, y];
            }
              //
          }
          //this.log("Created by "+vars.creatorPos);
        }
      // end of init
        //this.log("done init");
      }
      vars.commRobots = this.getVisibleRobots();

      vars.visibleRobots = [];
      vars.visibleEnemyRobots = [];
        for (var i=0; i<vars.commRobots.length; i++) {
            if (this.isVisible(vars.commRobots[i])) {
                vars.visibleRobots.push(vars.commRobots[i]);
                if (vars.commRobots[i].team!=this.me.team) {
                  vars.visibleEnemyRobots.push(vars.commRobots[i]);
                }
            }
        }


        utils.updateBaseLocs();
      // if (!this.firstTurn) return;
      // this.firstTurn = false;
        //this.log("mid robot");
      readMessages.call(this);
      // // send dummy messages
      // if(Math.random() < 0.001)
      //   sendMessage.call(this, 2**16-1, 100);
      // else if(Math.random() < 0.001)
      //   sendMessageTrusted.call(this, 2**8-1, 1000);
        var ret=null;
      switch (this.me.unit) {
        case vars.SPECS.PILGRIM:
          ret= this.pilgrimTurn();
              break;
        case vars.SPECS.CRUSADER:
          ret= this.crusaderTurn();
              break;
        case vars.SPECS.PROPHET:
          ret= this.prophetTurn();
              break;
        case vars.SPECS.PREACHER:
          ret= this.preacherTurn();
              break;
        case vars.SPECS.CHURCH:
          ret= this.churchTurn();
              break;
        case vars.SPECS.CASTLE:
          ret= this.castleTurn();
              break;
      }
        vars.firstTurn = false;
        return ret;
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
MyRobot.prototype.churchTurn = churchTurn;
MyRobot.prototype.prophetTurn = prophetTurn;
MyRobot.prototype.preacherTurn = preacherTurn;

var robot = new MyRobot();
