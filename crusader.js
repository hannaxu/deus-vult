export default function crusaderTurn() {
    this.log("I am a Crusader at "+this.xpos+" "+this.ypos);
    var choice = this.moveable[Math.floor(Math.random()*this.moveable.length)];
    return this.move(choice);
}