import vars from './variables';

var rLocs=[];
//type: 0 for fuel, 1 for karb
//x,y
//

function initRecList() {
    for (var x=0; x<xmax; x++) {
        for (var y=0; y<ymax; y++) {
            if (vars.fuelMap[y][x]) {
                rLocs.push({});
                rLocs[rLocs.length-1].type=0;
                rLocs[rLocs.length-1].x=x;
                rLocs[rLocs.length-1].y=y;
                rLocs[rLocs.length-1].lastFull=-500;
            } else if (vars.karbMap[y][x]) {
                rLocs.push({});
                rLocs[rLocs.length-1].x=x;
                rLocs[rLocs.length-1].y=y;
                rLocs[rLocs.length-1].lastFull=-500;
            }
        }
    }
}
export default function pilgrimTurn() {
    if (vars.firstTurn) {
        initRedList();
    }
    //this.log("I am a Pilgrim at "+vars.xpos+" "+vars.ypos);
    if (this.fuel >= 50) {
        for (var i = 0; i < vars.moveable.length; i++) {
            var x = this.me.x+vars.moveable[i][0];
            var y = this.me.y+vars.moveable[i][1];
            if (this.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
                //this.log("Moving to "+x+" "+y);
                return this.move(vars.moveable[i][0], vars.moveable[i][1]);
            }
        }
    }
}