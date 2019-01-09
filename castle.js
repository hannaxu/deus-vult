export default function castleTurn() {
    this.log("I am a Castle at "+this.xpos+" "+this.ypos);
    this.log(this.karbonite+" "+this.fuel);
    if (this.karbonite >= 10 && this.fuel >= 50) {
        for (var i = 0; i < this.buildable.length; i++) {
            var x = this.me.x+this.buildable[i][0];
            var y = this.me.y+this.buildable[i][1];
            if (this.checkBounds(y, x)&&this.passableMap[y][x]&&this.visibleRobotMap[y][x]==0) {
                this.log("Building pilgrim at "+x+" "+y);
                return this.buildUnit(this.SPECS.PILGRIM, this.buildable[i][0], this.buildable[i][1]);
            }
        }
    }
}