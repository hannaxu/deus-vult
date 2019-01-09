export default function pilgrimTurn() {
    this.log("I am a Pilgrim at "+this.xpos+" "+this.ypos);
    if (this.fuel >= 50) {
        for (var i = 0; i < this.moveable.length; i++) {
            var x = this.me.x+this.moveable[i][0];
            var y = this.me.y+this.moveable[i][1];
            if (this.checkBounds(y, x)&&this.passableMap[y][x]&&this.visibleRobotMap[y][x]==0) {
                this.log("Moving to "+x+" "+y);
                return this.move(this.moveable[i][0], this.moveable[i][1]);
            }
        }
    }
}