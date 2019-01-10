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
        vars.maxKarb = vars.SPECS.UNITS[this.me.unit].KARBONITE_CAPACITY;

        if (this.me.unit==vars.SPECS.CASTLE) {
          var symmetry = utils.checkMapSymmetry(vars.passableMap, vars.karbMap, vars.fuelMap);
          this.log("VERTICAL: " + symmetry[0] + "; HORIZONTAL: " + symmetry[1]);
        }

        utils.initRecList();


        for (var x = 1; x <= Math.sqrt(vars.moveRadius); x++) {
          for (var y = 0; y <= Math.sqrt(vars.moveRadius); y++) {
            if (x*x+y*y <= vars.moveRadius) {
              vars.moveable.push([x, y]);
              vars.moveable.push([-x, -y]);
              vars.moveable.push([-y, x]);
              vars.moveable.push([y, -x]);
            }
          }
        }
        //this.log("moveable created");

        for (var x = 1; x <= Math.sqrt(vars.buildRadius); x++) {
          for (var y = 0; y <= Math.sqrt(vars.buildRadius); y++) {
            if (x*x+y*y <= vars.buildRadius) {
              vars.buildable.push([x, y]);
              vars.buildable.push([-x, -y]);
              vars.buildable.push([-y, x]);
              vars.buildable.push([y, -x]);
            }
          }
        }
        //this.log("buildable created");

        for (var x = 0; x < vars.xmax; x++) {
          vars.fuzzyCost.push([]);
          for (var y = 0; y < vars.ymax; y++) {
            vars.fuzzyCost[x].push([]);
          }
        }
        //this.log("fuzzyCost created");

        // determines which castle/church created this unit
        if (this.me.unit!=vars.SPECS.CASTLE&&this.me.unit!=vars.SPECS.CHURCH) {
          for (var i = 0; i < vars.buildable.length; i++) {
            var x = this.me.x+vars.buildable[i][0];
            var y = this.me.y+vars.buildable[i][1];
            if (!this.checkBounds(x, y)) continue;
            var id = this.getRobot(vars.visibleRobotMap[y][x]);
            if (id==null||(id.unit!=vars.SPECS.CASTLE&&id.unit!=vars.SPECS.CHURCH)) continue;
            var dir = vars.buildable[id.signal];
            var correctSignal = dir[0]==-vars.buildable[i][0]&&dir[1]==-vars.buildable[i][1];
            if (correctSignal) {
              vars.creatorPos = [x, y];
            }
          }
          //this.log("Created by "+vars.creatorPos);
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
}

MyRobot.prototype.castleTurn = castleTurn;
MyRobot.prototype.crusaderTurn = crusaderTurn;
MyRobot.prototype.pilgrimTurn = pilgrimTurn;

var robot = new MyRobot();
