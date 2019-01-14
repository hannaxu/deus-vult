import vars from './variables';
import * as utils from './utils';
import { sendMessage, sendMessageTrusted, readMessages, cypherMessage } from './communication';

var enemyCastles = [];
var symmetry = [false, false];
var deusVult = null; // boolean for whether or not in attack phase

export default function preacherTurn() {
  this.log("I am a Preacher at "+vars.xpos+" "+vars.ypos);
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

  // check for DEUS VULT signal
  for (var i = 0; i < vars.radioRobots.length; i++) {
    var message = cypherMessage(vars.radioRobots[i].signal, this.me.team);
    if (message>=2**15) {
      //this.log("DEUS VULT RECEIVED");
      if (deusVult==null) {
        deusVult = [message-2**15];
        return;
      }
      else {
        deusVult = [deusVult[0], message-2**15];
        this.log(deusVult);
      }
    }
  }

  // goes to castle if there are no known enemyCastles
  if (deusVult==null) {
    for (var h in vars.castleLocs) {
      var loc = utils.unhashCoordinates(h);
      if ((this.me.x-loc[0])**2+(this.me.y-loc[1])**2 > vars.CAMPDIST) {
        var move = utils.findMove.call(this, [this.me.x, this.me.y], loc);
        if (move != null) {
          //this.log("Moving towards "+x+" "+y);
          return this.move(move[0], move[1]);
        }
      }
    }
  }

  // DEUS VULT, attack enemyCastles
  if (deusVult!=null) {
    var x = deusVult[0];
    var y = deusVult[1];
    var id = vars.visibleRobotMap[y][x];
    if (id==0||(id!=-1&&this.getRobot(id).unit!=vars.SPECS.CASTLE)) {
      deusVult = null;
      return;
    }
    var move = utils.findMove.call(this, [this.me.x, this.me.y], deusVult);
    if (move != null) {
      //this.log("Moving towards "+x+" "+y);
      return this.move(move[0], move[1]);
    }
  }
  else {
    var curDist = (this.me.x-vars.creatorPos[0])**2+(this.me.y-vars.creatorPos[1])**2;
    for (var i = 0; i < vars.moveable.length; i++) {
      var x = this.me.x+vars.moveable[i][0];
      var y = this.me.y+vars.moveable[i][1];
      var newDist = (x-vars.creatorPos[0])**2+(y-vars.creatorPos[1])**2;
      var open = utils.checkBounds(x, y) && vars.visibleRobotMap[y][x]==0 && vars.passableMap[y][x];
      if (open && curDist < newDist && newDist <= vars.CAMPDIST) {
        return this.move(vars.moveable[i][0], vars.moveable[i][1]);
      }
    }
  }
}
