import vars from '../variables';
import * as utils from '../utils';
import * as pilgrim_atk from './pilgrim_atk';

//rLocs:
//type 0 fuel
//x
//y
//closed= last time with worker on it
var recD;
var attacking = false;

var curPath = [];


export default function pilgrimTurn () {
    //this.log("I am a Pilgrim at "+this.me.x+" "+this.me.y);
    //this.log("entering");
    var me=this.me;
    var minDR=-1;
    var minDRv=9999;
    if (this.me.turn==1) {

        //ALEXEY LOOK HERE
        //do this for all enemy castles
        //seenEnms[castlexpos][castleypos]=500;

        if (vars.creatorPos!=null) {
            if ((vars.visibleRobotMap[vars.creatorPos[0]][vars.creatorPos[1]].signal & 1<<14) > 0) {
                attacking = true;
            }
        }

        resDirs=utils.findConnections.call(this, 20);

        for (var i=0; i<vars.rLocs.length; i++) {
            vars.rLocs[i].closed=-2000;
        }

        //initPossChurches.call(this);
    }

    if (attacking) {
        this.log('attack pilgrim');
        return pilgrim_atk.pilgrimAtkTurn.call(this);
    }

    for (var i=0; i<vars.rLocs.length; i++) {
        var p=vars.rLocs[i];
        if (vars.visibleRobotMap[p.y][p.x]>0 && (p.x!=me.x || p.y!=me.y) && this.getRobot(vars.visibleRobotMap[p.y][p.x]).unit==2) {
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
    if (minDR!=-1) utils.soloBFS.call(this, [vars.rLocs[minDR].x,vars.rLocs[minDR].y],4);

    for (var i=0; i<vars.visibleEnemyRobots.length; i++) {
        if (vars.visibleEnemyRobots[i].unit!=vars.SPECS.PILGRIM) {
            seenEnms[utils.hashCoordinates([vars.visibleEnemyRobots[i].x,vars.visibleEnemyRobots[i].y])]=me.turn;
        }
    }
    for (var i=0; i<vars.radioRobots.length; i++) {
        //this.log('Pilgrim intercepted signal');
        seenEnms[utils.hashCoordinates([vars.radioRobots[i].x,vars.radioRobots[i].y])]=me.turn;
    }
    //return rescources to the factory [always returns]
    if ( me.fuel==vars.maxFuel || me.karbonite== vars.maxKarb || (me.karbonite == vars.maxKarb/2 && vars.teamKarb <=15) ) {
        for (var i=0; i<8; i++) {
            var x=me.x+vars.buildable[i][0];
            var y=me.y+vars.buildable[i][1];
            if (utils.checkBounds(x,y) && vars.visibleRobotMap[y][x]>0) {
                var r=this.getRobot(vars.visibleRobotMap[y][x]);
                if (r!=null && (r.unit==vars.SPECS.CASTLE || r.unit==vars.SPECS.CHURCH)) {
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
                facts.push(utils.soloBFS.call(this, utils.unhashCoordinates(h),10));
                pris.push(0);
            }
            //this.log(facts.length);

            var ans= pickAdjMove.call(this,facts,pris);
            if (ans!=null) return ans;
        }
    }
    //go to resources [sometimes returns]
    if (vars.teamFuel>=4) {
        //this.log("To rloc");
        var openRecs=[];
        var pris=[];
        for (var i=0; i<vars.rLocs.length; i++) {
            var p=vars.rLocs[i];
            if ((p.x-me.x)**2 + (p.y-me.y)**2<200 && vars.fuzzyCost[p.x][p.y].length>0 && me.turn-p.closed>40) {

                var prival=999;
                for (var h in vars.baseLocs) {
                    var bpos=utils.unhashCoordinates(h);
                    var dist=vars.fuzzyCost[p.x][p.y][bpos[0]][bpos[1]];
                    if (dist!=null && dist[0]<prival) {
                        prival=dist[0];
                    }
                }
                prival-=p.type*(6);
                if (prival<900) {
                    openRecs.push(vars.fuzzyCost[p.x][p.y]);
                    pris.push(prival);
                }
            }
        }
        //this.log("hi");
        var ret= pickAdjMove.call(this,openRecs,pris);
        if (ret!=null) {
            return ret;
        }
    }
    //mine stuff [always returns]
    if (vars.teamFuel>=1 && (vars.karbMap[me.y][me.x] && me.karbonite!=20 || vars.fuelMap[me.y][me.x] && me.fuel!=100)) {
        //this.log("Mined stuff");
        return this.mine();
    }
    //go build a church [sometimes returns]
    if (vars.teamFuel>=4) {
        //this.log('churching');
        vars.CastleTalk.performOptional(1);
        newFactVal.call(this);
        //this.log('xddd');
        var bx=factPos[0];
        var by=factPos[1];

        //this.log(bx+" "+by+" is the best new base");
        if (bx==-1) {
            return null;
        }
        
        if ((bx-me.x)**2 + (by-me.y)**2<=2 && vars.teamKarb>=50 && vars.teamFuel>=200) {
            if (vars.visibleRobotMap[by][bx]==0) {
                this.log("Built church!");
                return this.buildUnit(vars.SPECS.CHURCH,bx-me.x,by-me.y);
            } else if (bx==me.x && by==me.y) {
                for (var i=0; i<8; i++) {
                    var xp=me.x+vars.buildable[i][0];
                    var yp=me.y+vars.buildable[i][1];
                    if (utils.checkBounds(xp,yp) && vars.passableMap[yp][xp] && vars.visibleRobotMap[yp][xp]==0) {
                        return this.move(vars.buildable[i][0],vars.buildable[i][1]);
                    }
                }
            } else {
                return null;
            }
        }
        var fdists=utils.soloBFS.call(this, [bx,by],20);
        //this.log('to facct');
        return pickAdjMove.call(this,[fdists],[0]);
    }

    return null;
}


var resDirs;
var factPos;
var seenEnms={}; //x,y->turn

function notNearEnemy(x,y,turn) {
    //return true;
    for (var h in seenEnms) {
            if (turn-seenEnms[h]>100) {
                delete seenEnms[h];
            } else {
                var pos=utils.unhashCoordinates(h);
                if ((pos[0]-x)**2 + (pos[1]-y)**2 < 64) {
                    return false;
                }
            }
        }
    return true;
}

function newFactVal() {
    if (!vars.baseChange && factPos!=undefined && notNearEnemy(factPos[0],factPos[1],this.me.turn)) {
        return factPos;
    }

    var me=this.me;
    vars.baseChange=false;
    var ret=[];
    for (var x=0; x<vars.xmax; x++) {
        ret.push([]);
        for (var y=0; y<vars.ymax; y++) {
            ret[x].push(vars.passableMap[y][x]?0:-10000);
        }
    }
    var bases=[];

    for (var h in vars.baseLocs) {
        bases.push(utils.unhashCoordinates(h));
    }
    //this.log(bases);
    var bdist=utils.bfs.call(this, bases,4);
    //this.log(bdist[33][10]);
    for (var i=0; i<vars.rLocs.length; i++) {
        var rx=vars.rLocs[i].x;
        var ry=vars.rLocs[i].y;
        ret[rx][ry]-=10000;
        var val=(1+2*vars.rLocs[i].type)*40;
        if (bdist[rx][ry]==null) {
            for (var d=0; d<resDirs.length; d++) {
                if (utils.checkBounds(rx+resDirs[d][0],ry+resDirs[d][1])) {
                    ret[rx+resDirs[d][0]][ry+resDirs[d][1]]+=val-(resDirs[d][0]**2+resDirs[d][1]**2);
                }
            }
        }
    }

    var best=0.5;
        var bx=-1;
        var by=-1;
        var distsC=utils.soloBFS.call(this,[me.x,me.y],20);
        for (var x=0; x<vars.xmax; x++) {
            for (var y=0; y<vars.ymax; y++) {
                if (distsC[x][y]==null) continue;
                var pval=ret[x][y]/distsC[x][y][0]*2;
                if (pval>best && notNearEnemy(x,y,me.turn)) {
                    var validp=true;
                    for (var i=0; i<8; i++) {
                        if (utils.checkBounds(x+vars.buildable[i][0],y+vars.buildable[i][1]) && ret[x+vars.buildable[i][0]][y+vars.buildable[i][1]]>ret[x][y]) {
                            validp=false;
                            break;
                        }
                    }
                    if (validp) {

                        best=pval*(Math.random()*0.3+0.7);
                        bx=x;
                        by=y;
                    }
                }
            }
        }
    if (bx==-1) {
        for (var h in seenEnms) {
            seenEnms[h]-=50;
        }
        return newFactVal.call(this);
    }
    //this.log('kek');
    factPos=[bx,by];
    return factPos;
}

//turns+pri
function minC(costs, pri,x,y) {
    //this.log('inc');
    var ret=99999;

    for (var i=0; i<costs.length; i++) {
        if (costs[i][x][y]!=null) {
            var c=(costs[i][x][y][0]+pri[i])*200+costs[i][x][y][1]*4;
            if (c<ret) {
                ret=c;
            }
        }
    }
    if (utils.hashCoordinates([x,y]) in vars.dangerTiles) {
        ret+=500;
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
        return this.move(vars.moveable[bestd][0],vars.moveable[bestd][1]);
    }
}

var hasChurch = null;

function hasCloseChurch () {
  hasChurch = [];
  for (var x = 0; x < vars.xmax; x++) {
    hasChurch.push([]);
    for (var y = 0; y < vars.ymax; y++) {
      hasChurch[x].push(vars.POS_INF);
    }
  }

  for (var h in vars.baseLocs) {
    var pos = utils.unhashCoordinates(h);
    for (var dx = -3; dx <= 3; dx++) {
      for (var dy = -3; dy <= 3; dy++) {
        var x = pos[0]+dx;
        var y = pos[1]+dy;
        hasChurch[y][x] = Math.min(hasChurch[y][x], dx**2+dy**2);
      }
    }
  }
}

function findBestChurch () {
  possChurches.sort(function(c1, c2) {
    var dist1 = (c1[1][0]-vars.xpos)**2+(c1[1][1]-vars.ypos)**2;
    var dist2 = (c2[1][0]-vars.xpos)**2+(c2[1][1]-vars.ypos)**2;
    if (dist1!=dist2) {
      return dist1-dist2;
    }
    return c1[0]-c2[0];
  });

  hasCloseChurch.call();

  var betterPos = [];
  for (var i = 0; i < possChurches.length; i++) {
    var pos = possChurches[i][1];
    if (!hasChurch[pos[1]][pos[0]]) {
      betterPos.push(pos);
    }
  }

  if (betterPos.length==0) {
    return null;
  }

  betterPos.sort(function(c1, c2) {
    var dist1 = (c1[0]-vars.xpos)**2+(c1[1]-vars.ypos)**2;
    var dist2 = (c2[0]-vars.xpos)**2+(c2[1]-vars.ypos)**2;
    return dist1-dist2;
  });

  return betterPos[0];
}

function initPossChurches () {
  // [resource count, pos]
  possChurches = [];
  for (var x = 0; x < vars.xmax; x++) {
    for (var y = 0; y < vars.ymax; y++) {
      if (utils.checkBounds(x, y)&&vars.passableMap[y][x]) {
        // doesn't build on resource tiles
        if (vars.fuelMap[y][x]||vars.karbMap[y][x]) {
          continue;
        }
        var count = 0; // how many adjacent resource tiles
        for (var i = 0; i < vars.buildable.length; i++) {
          var bx = x+vars.buildable[i][0];
          var by = y+vars.buildable[i][1];
          if (utils.checkBounds(bx, by)&&vars.passableMap[by][bx]) {
            if (vars.fuelMap[by][bx]||vars.karbMap[by][bx]) {
              count++;
            }
          }
        }
        possChurches.push([count, [x, y]]);
      }
    }
  }
  //this.log(possChurches);
}
