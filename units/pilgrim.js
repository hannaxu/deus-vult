import vars from '../variables';
import * as utils from '../utils';

//type 0 fuel
//x
//y
//closed= last time with worker on it
var recD;
export default function pilgrimTurn () {
    //this.log("I am a Pilgrim at "+this.me.x+" "+this.me.y);
    //this.log("entering");
    var me=this.me;
    var minDR=-1;
    var minDRv=9999;
    if (this.me.turn==1) {
        for (var i=0; i<vars.rLocs.length; i++) {
            vars.rLocs[i].closed=-2000;
        }
    }
    for (var i=0; i<vars.rLocs.length; i++) {
        var p=vars.rLocs[i];
        if (vars.visibleRobotMap[p.y][p.x]>0 && (p.x!=me.x || p.y!=me.y)) {
            vars.rLocs[i].closed=me.turn;
        }
    }
    for (var i=0; i<vars.rLocs.length; i++) {
        var d2=(me.x-vars.rLocs[i].x)**2+(me.y-vars.rLocs[i].y)**2;
        if (d2<minDRv && vars.fuzzyCost[vars.rLocs[i].x][vars.rLocs[i].y].length==0) {
            minDR=i;
            minDRv=d2;
        }
    }
    if (minDR!=-1) utils.soloBFS([vars.rLocs[minDR].x,vars.rLocs[minDR].y]);
    //this.log("hi");
    if (me.karbonite==vars.maxKarb || me.fuel==vars.maxFuel) {
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
        if (vars.teamFuel>=2) {
            //this.log("To factory");
            var facts=[];
            var pris=[];
            for (var h in vars.baseLocs) {
                facts.push(utils.soloBFS(utils.unhashCoordinates(h)));
                pris.push(0);
            }
            //this.log(facts.length);
            
            return pickAdjMove.call(this,facts,pris);
        }
    }
    if (vars.teamFuel>=4) {
        //this.log("To rloc");
        var openRecs=[];
        var pris=[];
        for (var i=0; i<vars.rLocs.length; i++) {
            var p=vars.rLocs[i];
            if ((p.x-me.x)**2 + (p.y-me.y)**2<400 && vars.fuzzyCost[p.x][p.y].length>0 && me.turn-p.closed>100) {
                openRecs.push(vars.fuzzyCost[p.x][p.y]);   
                pris.push(p.type*(-6));
            }
        }
        //this.log("hi");
        var ret= pickAdjMove.call(this,openRecs,pris);
        if (ret!=null) {
            return ret;
        }
    }
    if (vars.teamFuel>=1 && (vars.karbMap[me.y][me.x] || vars.fuelMap[me.y][me.x])) {
        //this.log("Mined stuff");
        return this.mine();
    }
    //this.log(vars.teamFuel);
    
    return null;
}

//turns+pri
function minC(costs, pri,x,y) {
    //this.log('inc');
    var ret=99999;
    for (var i=0; i<costs.length; i++) {
        if (costs[i][x][y]!=null) {
            var c=(costs[i][x][y][0]+pri[i])*200+costs[i][x][y][1];
            if (c<ret) {
                ret=c;
            }
        }
    }
    //this.log('outc');
    return ret;
}

function pickAdjMove(costs, pri) {
    var me=this.me;
    //this.log(costs.length);
    var best=minC(costs,pri,me.x,me.y);
    var bestd=-1;
    //this.log('yo');
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
        this.castleTalk(bestd);
        return this.move(vars.moveable[bestd][0],vars.moveable[bestd][1]);
    }
}
