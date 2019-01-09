import { BCAbstractRobot, SPECS } from 'battlecode';
import castleTurn from './castle';
import crusaderTurn from './crusader';
import pilgrimTurn from './pilgrim';

class MyRobot extends BCAbstractRobot {
  constructor () {
    super();

    // constants
    this.SPECS = SPECS;
    this.moveable = [];
    this.buildable = [];
    this.POS_INF = 2147483647;
    this.NEG_INF = -2147483648;

    // initialize once
    this.firstTurn = true;
    this.passableMap = null;
    this.karbMap = null;
    this.fuelMap = null;
    this.xmax;
    this.ymax;
    this.moveRadius;
    this.sightRadius;
    this.buildRadius;
    this.moveCost;
    this.unitType;
    this.creatorPos;

    // frequent updates
    this.turnCount = -1;
    this.visibleRobotMap = null;
    this.fuzzyCost = [];
  }

  turn () {
    try {
      this.visibleRobotMap = this.getVisibleRobotMap();

      if (this.firstTurn) {
        this.passableMap = this.getPassableMap();
        this.karbMap = this.getKarboniteMap();
        this.fuelMap = this.getFuelMap();
        this.xmax = this.passableMap.length;
        this.ymax = this.passableMap[0].length;

        this.buildRadius = 2;
        this.moveCost = 1;
        switch (this.me.unit) {
          case this.SPECS.PILGRIM:
            this.sightRadius = 100;
            this.moveRadius = 4;
            break;
          case this.SPECS.CRUSADER:
            this.sightRadius = 36;
            this.moveRadius = 9;
            break;
          case this.SPECS.CASTLE:
            this.sightRadius = 100;
            this.moveRadius = 0;
            break;
        }

        for (var x = 1; x <= Math.sqrt(this.moveRadius); x++) {
          for (var y = 0; y <= Math.sqrt(this.moveRadius); y++) {
            if (x*x+y*y <= this.moveRadius) {
              this.moveable.push([x, y]);
              this.moveable.push([-x, -y]);
              this.moveable.push([-x, y]);
              this.moveable.push([x, -y]);
            }
          }
        }

        for (var x = 1; x <= Math.sqrt(this.buildRadius); x++) {
          for (var y = 0; y <= Math.sqrt(this.buildRadius); y++) {
            if (x*x+y*y <= this.buildRadius) {
              this.buildable.push([x, y]);
              this.buildable.push([-x, -y]);
              this.buildable.push([-x, y]);
              this.buildable.push([x, -y]);
            }
          }
        }

        for (var x = 0; x < this.xmax; x++) {
          this.fuzzyCost.push([]);
          for (var y = 0; y < this.ymax; y++) {
            this.fuzzyCost[x].push([]);
          }
        }

        if (this.me.unit!=this.SPECS.CASTLE) {
          for (var i = 0; i < this.buildable.length; i++) {
            var x = this.me.x+this.buildable[i][0];
            var y = this.me.y+this.buildable[i][1];
            if (!this.checkBounds(x, y)) continue;
            var id = this.getRobot(this.visibleRobotMap[y][x]);
            if (id==null) continue;
            var xsig = Math.floor(id.signal/100);
            var ysig = id.signal%100;
            if (id.unit==this.SPECS.CASTLE&&xsig==this.me.x&&ysig==this.me.y) {
              this.creatorPos = [x, y];
            }
          }
          this.log("Created by "+this.creatorPos);
        }
        this.firstTurn = false;
      // end of init
      }
      // if (!this.firstTurn) return;
      // this.firstTurn = false;

      switch (this.me.unit) {
        case this.SPECS.PILGRIM:
          return this.pilgrimTurn();
        case this.SPECS.CRUSADER:
          return this.crusaderTurn();
        case this.SPECS.CASTLE:
          return this.castleTurn();
      }
    }
    catch (err) {
      this.log("Error "+err);
    }
  }

  checkBounds(x, y) {
    return 0 <= x && x < this.xmax && 0 <= y && y < this.ymax;
  }

  findMove(start, end) {
    if (this.fuzzyCost[end[0]][end[1]].length==0) {
      for (var x = 0; x < this.xmax; x++) {
        this.fuzzyCost[end[0]][end[1]].push([]);
        for (var y = 0; y < this.ymax; y++) {
          this.fuzzyCost[end[0]][end[1]][x].push(null);
        }
      }
      this.bfs(end);
    }
    var bestMove = [this.POS_INF, this.POS_INF, null];
    for (var i = 0; i < this.moveable.length; i++) {
      var x = this.me.x+this.moveable[i][0];
      var y = this.me.y+this.moveable[i][1];
      if (this.checkBounds(x, y)&&this.passableMap[y][x]&&this.visibleRobotMap[y][x]==0) {
        var move = this.fuzzyCost[end[0]][end[1]][x][y];
        if (move[0]<bestMove[0]) {
          bestMove = [move[0], move[1], this.moveable[i]];
        }
        else if(move[0]==bestMove[0]&&move[1]<bestMove[0]) {
          bestMove = [move[0], move[1], this.moveable[i]];
        }
      }
    }
    return bestMove[2];
  }

  bfs (end) {
    var index = 0;
    var queue = [];
    queue.push(end);
    this.fuzzyCost[end[0]][end[1]][end[0]][end[1]] = [0, 0];
    while (index<queue.length) {
      //this.log("q "+queue[index]);
      var curCost = this.fuzzyCost[end[0]][end[1]][queue[index][0]][queue[index][1]];
      for (var i = 0; i < this.moveable.length; i++) {
        var x = queue[index][0]+this.moveable[i][0];
        var y = queue[index][1]+this.moveable[i][1];
        if (this.checkBounds(x, y)&&this.passableMap[y][x]&&this.fuzzyCost[end[0]][end[1]][x][y]==null) {
          queue.push([x, y]);
          this.fuzzyCost[end[0]][end[1]][x][y] = [curCost[0]+1, curCost[1]+this.moveCost*(this.moveable[i][0]**2+this.moveable[i][1]**2)];
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
