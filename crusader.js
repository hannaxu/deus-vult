import vars from './variables';

export default function crusaderTurn() {
    this.log("I am a Crusader at "+vars.xpos+" "+vars.ypos);
    var choice = vars.moveable[Math.floor(Math.random()*vars.moveable.length)];
    return this.move(choice);
}