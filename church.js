import vars from './variables';
import * as utils from './utils';
import { sendMessage } from './communication';

export default function castleTurn() {
  this.log("I am a Church at "+this.me.x+" "+this.me.y);
  this.log("Resources: "+this.karbonite+" "+this.fuel);
  if (vars.firstTurn) {
    vars.firstTurn = false;
  }

  if (this.karbonite >= 10 && this.fuel >= 50) {
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (this.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
        sendMessage.call(this, i, vars.buildable[i][0]**2+vars.buildable[i][1]);
        //this.log("Building pilgrim at "+x+" "+y);
        return this.buildUnit(vars.SPECS.PILGRIM, vars.buildable[i][0], vars.buildable[i][1]);
      }
    }
  }
}
