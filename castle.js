import vars from './variables';

export default function castleTurn() {
    this.log("I am a Castle at "+vars.xpos+" "+vars.ypos);
    this.log("Resources: "+this.karbonite+" "+this.fuel);
    if (this.karbonite >= 10 && this.fuel >= 50) {
        for (var i = 0; i < vars.buildable.length; i++) {
            var x = this.me.x+vars.buildable[i][0];
            var y = this.me.y+vars.buildable[i][1];
            if (this.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
                this.log("Building pilgrim at "+x+" "+y);
                return this.buildUnit(vars.SPECS.PILGRIM, vars.buildable[i][0], vars.buildable[i][1]);
            }
        }
    }
}