import vars from './variables';
import * as utils from './utils';

export default function preacherTurn() {
  this.log("I am a Preacher at "+vars.xpos+" "+vars.ypos);
  if (vars.firstTurn) {
    vars.firstTurn = false;
  }

  var choice = vars.moveable[Math.floor(Math.random()*vars.moveable.length)];
  return this.move(choice);
}
