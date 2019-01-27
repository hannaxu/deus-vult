import { BCAbstractRobot, SPECS } from 'battlecode';

import vars from './variables';

import castleTurn from './units/castle';
import crusaderTurn from './units/crusader';
import pilgrimTurn from './units/pilgrim';
import churchTurn from './units/church';
import prophetTurn from './units/prophet';
import preacherTurn from './units/preacher';

import * as utils from './utils';
import { sendMessage, sendMessageTrusted, readMessages, cypherMessage } from './communication';
import CastleTalk from './castleTalk';
import { testAll } from './unitTests';

class MyRobot extends BCAbstractRobot {
  constructor () {
    super();
    vars.SPECS = SPECS;
  }

  turn () {
    try {
      vars.turnStartTime = new Date().getTime();
      vars.visibleRobotMap = this.getVisibleRobotMap();
      vars.me = this.me;
      vars.xpos = this.me.x;
      vars.ypos = this.me.y;
      vars.myPos = [this.me.x, this.me.y];
      vars.teamFuel = this.fuel;
      vars.teamKarb = this.karbonite;

      if (this.me.turn==1) {
        vars.passableMap = this.map;
        vars.karbMap = this.getKarboniteMap();
        vars.fuelMap = this.getFuelMap();
        vars.ymax = vars.passableMap.length;
        vars.xmax = vars.passableMap[0].length;
        vars.attackRadius = vars.SPECS.UNITS[this.me.unit].ATTACK_RADIUS;
        vars.buildRadius = 2;
        vars.visionRadius = vars.SPECS.UNITS[this.me.unit].VISION_RADIUS;
        vars.attackCost = vars.SPECS.UNITS[this.me.unit].ATTACK_FUEL_COST;
        vars.moveCost = vars.SPECS.UNITS[this.me.unit].FUEL_PER_MOVE;
        vars.maxKarb = vars.SPECS.UNITS[this.me.unit].KARBONITE_CAPACITY;
        vars.maxFuel = vars.SPECS.UNITS[this.me.unit].FUEL_CAPACITY;
        utils.initRecList();

        vars.visible = utils.findConnections.call(this, vars.visionRadius);
        utils.findAllAttackable(); // initializes vars.allAttackable
        vars.attackable = vars.allAttackable[this.me.unit];
        vars.buildable = utils.findConnections.call(this, vars.buildRadius);

        vars.CastleTalk = new CastleTalk(this);

        for (var x = 0; x < vars.xmax; x++) {
          vars.fuzzyCost.push([]);
          for (var y = 0; y < vars.ymax; y++) {
            vars.fuzzyCost[x].push([]);
          }
        }

        // for moving robots only
        if (this.me.unit >= 2) {
          for (var i = 0; i < vars.buildable.length; i++) {
            var x = this.me.x+vars.buildable[i][0];
            var y = this.me.y+vars.buildable[i][1];
            if (!utils.checkBounds(x, y)) continue;
            var id = this.getRobot(vars.visibleRobotMap[y][x]);
            if (id==null||(id.unit!=vars.SPECS.CASTLE&&id.unit!=vars.SPECS.CHURCH)) continue;
            vars.creatorPos = [x, y];
            vars.creatorID = vars.visibleRobotMap[y][x];
            //this.log(vars.creatorPos);
          }
          //this.log("Created by "+vars.creatorPos);
        }
        //testAll.call(this, false);

        // end of init
        //this.log("done init");
      }

      this.castleTalk(0);
      vars.commRobots = this.getVisibleRobots();
      vars.visibleRobots = [];
      vars.visibleEnemyRobots = [];
      vars.radioRobots = [];
      switch (this.me.unit) {
        case vars.SPECS.CASTLE:
          vars.castleTalkRobots = [];
          break;
        default:
          vars.castleTalkRobots = null;
          break;
      }
      for(var i = 0; i < vars.commRobots.length; i++) {
        var other_r = vars.commRobots[i];
        if(other_r.id == this.me.id)
          continue;
        if(this.isVisible(other_r)) {
          vars.visibleRobots.push(other_r);
          if (vars.commRobots[i].team!=this.me.team) {
            vars.visibleEnemyRobots.push(vars.commRobots[i]);
          }
        }
        if(this.isRadioing(other_r))
          vars.radioRobots.push(other_r);
        if(vars.castleTalkRobots != null && other_r.team == this.me.team && other_r.castle_talk != 0){
          vars.castleTalkRobots.push(other_r);
        }
      }
      utils.updateLocs.call(this);
      // finds tiles that can be hit by enemies
      vars.dangerTiles = {};
      for (var i = 0; i < vars.visibleEnemyRobots.length; i++) {
        var robot = vars.visibleEnemyRobots[i];
        var u = robot.unit;
        for (var i = 0; i < vars.allAttackable[u].length; i++) {
          var x = robot.x+vars.allAttackable[u][i][0];
          var y = robot.y+vars.allAttackable[u][i][1];
          vars.dangerTiles[utils.hashCoordinates([x, y])] = 0;
        }
      }

      readMessages.call(this);

      var ret = null;
      switch (this.me.unit) {
        case vars.SPECS.PILGRIM:
          ret = this.pilgrimTurn();
          break;
        case vars.SPECS.CRUSADER:
          ret = this.crusaderTurn();
          break;
        case vars.SPECS.PROPHET:
          ret = this.prophetTurn();
          break;
        case vars.SPECS.PREACHER:
          ret = this.preacherTurn();
          break;
        case vars.SPECS.CHURCH:
          ret = this.churchTurn();
          break;
        case vars.SPECS.CASTLE:
          ret= this.castleTurn();
          break;
      }

      if(ret != null){
        switch(ret.action){
          case 'build':
            var val = {'dxdy': [ret.dx, ret.dy]};
            if(this.me.unit != vars.SPECS.PILGRIM)
              val.unit = ret.build_unit;
            vars.CastleTalk.performAction('build', val);
            break;
          case 'move':
            vars.CastleTalk.performAction('move', {'dxdy': [ret.dx, ret.dy]});
            break;
          case 'mine':
            vars.CastleTalk.performAction('mine', {});
            break;
          case 'give':
            vars.CastleTalk.performAction('give', {'dxdy': [ret.dx, ret.dy]});
        }
      }
      vars.CastleTalk.send();

      vars.firstTurn = false;
      return ret;
    }
    catch (err) {
      this.log("Error in unit "+this.me.unit+" at ("+this.me.x+", "+this.me.y+")");
      if(true){
        var lines = err.stack.split('\n');
        for(var i in lines){
          this.log(lines[i]);
        }
      }
      else
        this.log(err.toString());
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
