import vars from '../variables';
import * as utils from '../utils';


var recD;
export default function pilgrimTurn () {
    //this.log("I am a Pilgrim at "+this.me.x+" "+this.me.y);
    //this.log("entering");
    var me=this.me;
    if (vars.firstTurn) {

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
            var facts=[];
            var pris=[];
            for (var h in vars.baseLocs) {
                facts.push(utils.soloBFS(utils.unhashCoordinates(h)));
                pris.push(0);
            }
            //this.log(facts.length);
            //this.log("To factory");
            return pickAdjMove.call(this,facts,pris);
        }
    }
    if (vars.teamFuel>=1 && (vars.karbMap[me.y][me.x] || vars.fuelMap[me.y][me.x])) {
        //this.log("Mined stuff");
        return this.mine();
    }
    //this.log(vars.teamFuel);
    if (vars.teamFuel>=4) {
        //this.log("To rloc");
        var openRecs=[];
        var pris=[];
        for (var i=0; i<vars.rLocs.length; i++) {
            var p=vars.rLocs[i];
            openRecs.push(utils.soloBFS([p.x,p.y]));
            pris.push(p.type*(-6));
        }
        return pickAdjMove.call(this,openRecs,pris);
    }
    return null;
}

//turns+pri
function minC(costs, pri,x,y) {
    var ret=99999;
    for (var i=0; i<costs.length; i++) {
        if (costs[i][x][y]!=null) {
            var c=(costs[i][x][y][0]+pri[i])*200+costs[i][x][y][1];
            if (c<ret) {
                ret=c;
            }
        }
    }
    return ret;
}

function pickAdjMove(costs, pri) {
    var me=this.me;
    var best=minC(costs,pri,me.x,me.y);
    var bestd=-1;
    //thas.log(best);
    for (var i=0; i<vars.moveable.length; i++) {
        var x=me.x+vars.moveable[i][0];
        var y=me.y+vars.moveable[i][1];
        if (utils.checkBounds(x,y) && vars.visibleRobotMap[y][x]==0 && vars.passableMap[y][x]) {
            var c=minC(costs,pri,x,y)+vars.moveable[i][0]**2+vars.moveable[i][1]**2;
            if (c<best) {
                best=c;
                bestd=i;
            }
        }
    }
    //thas.log("point");
    if (bestd==-1) {
        return null;
    } else {
        //thas.log(bestd);
        //thas.log(vars.passableMap[y][x]);
        return this.move(vars.moveable[bestd][0],vars.moveable[bestd][1]);
    }
}
