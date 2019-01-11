import { BCAbstractRobot, SPECS } from 'battlecode';

import vars from './variables';

import castleTurn from './castle';
import crusaderTurn from './crusader';
import pilgrimTurn from './pilgrim';

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

      if (vars.firstTurn) {

        vars.passableMap = this.getPassableMap();
        vars.karbMap = this.getKarboniteMap();
        vars.fuelMap = this.getFuelMap();
        vars.xmax = vars.passableMap.length;
        vars.ymax = vars.passableMap[0].length;

        vars.moveRadius = vars.SPECS.UNITS[this.me.unit].SPEED;
        vars.attackRadius = vars.SPECS.UNITS[this.me.unit].ATTACK_RADIUS;
        vars.buildRadius = 2;
        vars.visionRadius = vars.SPECS.UNITS[this.me.unit].VISION_RADIUS;
        vars.attackCost = vars.SPECS.UNITS[this.me.unit].ATTACK_FUEL_COST;
        vars.moveCost = vars.SPECS.UNITS[this.me.unit].FUEL_PER_MOVE;
        vars.maxKarb = vars.SPECS.UNITS[this.me.unit].KARBONITE_CAPACITY;

        utils.initRecList();

        vars.visible = utils.findConnections(vars.visionRadius);
        vars.attackable = utils.findConnections(vars.attackRadius);
        vars.moveable = utils.findConnections(vars.moveRadius);
        vars.buildable = utils.findConnections(vars.buildRadius);
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
            if (!utils.checkBounds(x, y)) continue;
            var id = this.getRobot(vars.visibleRobotMap[y][x]);
            if (id==null||(id.unit!=vars.SPECS.CASTLE&&id.unit!=vars.SPECS.CHURCH)) continue;
            var dir = vars.buildable[cypherMessage(id.signal, this.me.team)];
            var correctSignal = dir[0]==-vars.buildable[i][0]&&dir[1]==-vars.buildable[i][1];
            if (correctSignal) {
              vars.creatorPos = [x, y];
            }
          }
          //this.log("Created by "+vars.creatorPos);
        }
      // end of init
      }

      vars.visibleRobots = this.getVisibleRobots();

      // if (!this.firstTurn) return;
      // this.firstTurn = false;
      utils.updateBaseLocs.call(this);

      readMessages.call(this);
      // // send dummy messages
      // if(Math.random() < 0.001)
      //   sendMessage.call(this, 2**16-1, 100);
      // else if(Math.random() < 0.001)
      //   sendMessageTrusted.call(this, 2**8-1, 1000);

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
