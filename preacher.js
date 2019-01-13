import vars from './variables';
import * as utils from './utils';
import { sendMessage, sendMessageTrusted, readMessages, cypherMessage } from './communication';

var enemyCastles = [];
var symmetry = [false, false];

export default function preacherTurn() {
  //this.log("I am a Preacher at "+vars.xpos+" "+vars.ypos);
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
      enemyCastles.push([vars.xmax-1-this.me.x, this.me.y]);
    }
    if (symmetry[1]) {
      enemyCastles.push([this.me.x, vars.ymax-1-this.me.y]);
    }
    vars.firstTurn = false;
  }

  var bestDir = null;
  var maxHit = vars.NEG_INF;
  for (var i = 0; i < vars.visibleEnemyRobots.length; i++) {
    var x = vars.visibleEnemyRobots[i].x;
    var y = vars.visibleEnemyRobots[i].y;
    var dx = x-this.me.x;
    var dy = y-this.me.y;
    if (vars.attackRadius[0]<=dx**2+dy**2&&dx**2+dy**2<=vars.attackRadius[1]) {
      var hit = 0;
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
          }
        }
      }
      vars.buildable.splice(8, 1);
      //this.log(hit);
      if (hit > maxHit) {
        bestDir = [dx, dy];
        maxHit = hit;
      }
    }
  }
  if (bestDir!=null) {
    //this.log("Attacking "+(this.me.x+bestDir[0])+" "+(this.me.y+bestDir[1]));
    return this.attack(bestDir[0], bestDir[1]);
  }

  for (var i = 0; i < enemyCastles.length; i++) {
    var x = enemyCastles[i][0];
    var y = enemyCastles[i][1];
    var id = vars.visibleRobotMap[y][x];
    if (id==0||(id!=-1&&this.getRobot(id).unit!=vars.SPECS.CASTLE)) {
      enemyCastles.splice(i, 1);
      i--;
      continue;
    }
    var move = utils.findMove([this.me.x, this.me.y], enemyCastles[i]);
    if (move != null) {
      //this.log("Moving towards "+x+" "+y);
      return this.move(move[0], move[1]);
    }
    //costs = bfs([this.me.x, this.me.y], [enemyCastles[i]]);
  }
}
