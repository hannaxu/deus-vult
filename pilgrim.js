import vars from './variables';

export default function pilgrimTurn() {
    this.log("I am a Pilgrim at "+vars.xpos+" "+vars.ypos);
    if (this.fuel >= 50) {
        for (var i = 0; i < vars.moveable.length; i++) {
            var x = this.me.x+vars.moveable[i][0];
            var y = this.me.y+vars.moveable[i][1];
            if (this.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
                this.log("Moving to "+x+" "+y);
                return this.move(vars.moveable[i][0], vars.moveable[i][1]);
            }
        }
    }
}