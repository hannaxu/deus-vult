import { BCAbstractRobot, SPECS } from 'battlecode';

import vars from './variables';

import castleTurn from './units/castle';
import crusaderTurn from './units/crusader';
import pilgrimTurn from './units/pilgrim';
import churchTurn from './units/church';
import prophetTurn from './units/prophet';
import preacherTurn from './units/preacher';

import * as utils from './utils';
import { sendMessage, sendMessageTrusted, readMessages, castleLocsComm, cypherMessage } from './communication';
import CastleTalk from './castleTalk';

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
      vars.teamFuel = this.fuel;
      vars.teamKarb = this.kabonite;

      if (vars.firstTurn) {
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

        vars.visible = utils.findConnections.call(this, 1, vars.visionRadius);
        if (vars.attackRadius!=null)
          vars.attackable = utils.findConnections.call(this, vars.attackRadius[0], vars.attackRadius[1]);
        vars.buildable = utils.findConnections.call(this, 1, vars.buildRadius);

        vars.CastleTalk = new CastleTalk(this);
        
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
            if (!utils.checkBounds(x, y)) continue;
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
        if(this.castleTalkRobots != null && other_r.castle_talk != 0)
          vars.castleTalkRobots.push(other_r);
      }
      utils.updateLocs.call(this);
      readMessages.call(this);

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
          castleLocsComm.call(this);
          ret= this.castleTurn();
          break;
      }

      // temporary failsafe
      if(vars.creatorPos != null){
        var creatorId = vars.visibleRobotMap[vars.creatorPos[1]][vars.creatorPos[0]];
        if(creatorId > 0){
          var creator = this.getRobot(creatorId);
          if(creator.unit == SPECS.CASTLE && creator.turn <= 2){
            this.castleTalk(0);
          }
        }
      }

      vars.firstTurn = false;
      return ret;
    }
    catch (err) {
      this.log("Error in unit "+this.me.unit+" at ("+this.me.x+", "+this.me.y+")");
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
