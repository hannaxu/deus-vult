import vars from './variables';
import * as utils from './utils';


var recD;
export default function pilgrimTurn () {
    //this.log("entering");
    var me=this.me;
    if (vars.firstTurn) {
        var openRecs=[];
        
        for (var i=0; i<vars.rLocs.length; i++) {
            var p=vars.rLocs[i];
            openRecs.push([p.x,p.y]);
        }
        //this.log(openRecs.length);
        recD=utils.multiDest(openRecs);
    }
    if (3*(me.karbonite*vars.maxFuel+me.fuel*vars.maxKarb)>(vars.maxFuel*vars.maxKarb)) {
        //this.log("hi");
        for (var i=0; i<8; i++) {
            var x=me.x+vars.buildable[i][0];
            var y=me.y+vars.buildable[i][1];
            if (utils.checkBounds(x,y) && vars.visibleRobotMap[y][x]>0) {
                var r=this.getRobot(vars.visibleRobotMap[y][x]);
                if (r!=null && (r.unit==vars.SPECS.CASTLE || r.unit==vars.SPECS.CASTLE)) {
                    //this.log("giving stuff");
                    return this.give(vars.buildable[i][0],vars.buildable[i][1],me.karbonite,me.fuel);
                }
            }
        }
        if (vars.teamFuel>=2 && (me.karbonite==vars.maxKarb || me.fuel==vars.maxFuel)) {
            var facts=[]
            for (var h in vars.baseLocs) {
                facts.push(utils.unhashCoordinates(h));
            }
            //this.log(facts.length);
            var dists=utils.multiDest(facts);
            //this.log("To factory");
            return pickAdjMove(dists,this);
        }
    }
    if (vars.teamFuel>=1 && (vars.karbMap[me.y][me.x] || vars.fuelMap[me.y][me.x])) {
        //this.log("Mined stuff");
        return this.mine();
    }
    //this.log(vars.teamFuel);
    if (vars.teamFuel>2) {
        
        //this.log("Headed to depot");
        return pickAdjMove(recD,this);
    }
    return null;
}
                    
function pickAdjMove(costs,thas) {
    var me=thas.me;
    if (costs[me.x][me.y]==null) {
        return null;
    }
    var best=costs[me.x][me.y][1]+costs[me.x][me.y][0];
    var bestd=-1;
    //thas.log(best);
    for (var i=0; i<vars.moveable.length; i++) {
        var x=me.x+vars.moveable[i][0];
        var y=me.y+vars.moveable[i][1];
        if (utils.checkBounds(x,y) && vars.visibleRobotMap[y][x]==0 && vars.passableMap[x][y] && costs[x][y]!=null && costs[x][y]!=undefined && costs[x][y][1]+costs[x][y][0]+vars.moveable[i][0]**2+vars.moveable[i][1]**2<best) {
            best=costs[x][y][0]+costs[x][y][1]+vars.moveable[i][0]**2+vars.moveable[i][1]**2;
            bestd=i;
            
        }
    }
    //thas.log("point");
    if (bestd==-1) {
        return null;
    } else {
        //thas.log(bestd);
        //thas.log(vars.passableMap[y][x]);
        return thas.move(vars.moveable[bestd][0],vars.moveable[bestd][1]);
    }
}

