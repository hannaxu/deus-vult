export default function crusaderTurn() {
    this.log("I am a Crusader at "+this.me.x+" "+this.me.y);
    var choice = this.moveable[Math.floor(Math.random()*this.moveable.length)];
    return this.move(choice);
}
