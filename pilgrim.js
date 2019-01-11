import vars from './variables';
import * as utils from './utils';

export default function pilgrimTurn () {
    var me=this.me;
    if (3*(me.karbonite*vars.maxFuel+me.fuel*vars.maxKarb)>(vars.maxFuel*vars.maxKarb)) {
        for (var i=0; i<8; i++) {
            var x=me.x+vars.buildable[i][0];
            var y=me.y+vars.buildable[i][1];
            if (utils.checkBounds(x,y) && vars.visibleRobotMap[y][x]>0) {
                var r=this.getRobot(vars.visibleRobotMap[y][x]);
                if (r!=null && (r.unit==vars.SPECS.CASTLE || r.unit==vars.SPECS.CASTLE)) {
                    return this.give(vars.buildable[i][0],vars.buildable[i][1],me.karbonite,me.fuel);
                }
            }
        }
        if (vars.teamFuel>=2 && (me.karbonite==vars.maxKarb || me.fuel==vars.maxFuel)) {
            var facts=[]
            for (var h in vars.baseLocs) {
                facts.push(utils.unhashCoordinates(h));
            }
            var dists=utils.multiDest(facts);
            this.log("To factory");
            return pickAdjMove(dists,this);
        }
    }
    if (vars.teamFuel>=1 && (vars.karbMap[me.y][me.x] || vars.fuelMap[me.y][me.x])) {
        return this.mine();
    }
    //this.log(vars.teamFuel);
    if (vars.teamFuel>2) {
        var openRecs=[];
        for (var i=0; i<vars.rLocs.length; i++) {
            var p=vars.rLocs[i];
            openRecs.push([p.x,p.y]);
        }
        var dists=utils.multiDest(openRecs);
        this.log("Headed to depot");
        return pickAdjMove(dists,this);
    }
    return null;
}
                    
function pickAdjMove(costs,thas) {
    var me=thas.me;
    var best=costs[me.x][me.y][0];
    var bestd=-1;
    for (var i=0; i<8; i++) {
        var x=me.x+vars.buildable[i][0];
        var y=me.y+vars.buildable[i][1];
        if (utils.checkBounds(x,y)) {
            thas.log(costs[x][y]);
        }
        if (utils.checkBounds(x,y) && vars.visibleRobotMap[y][x]==0 && vars.passableMap[y][x] && costs[x][y][0]<best) {
            best=costs[x][y][0];
            bestd=i;
            that.log("possible");
        }
    }
    if (bestd==-1) {
        return null;
    } else {
        thas.log(best);
        return thas.move(vars.buildable[bestd][0],vars.buildable[bestd][1]);
    }
}

