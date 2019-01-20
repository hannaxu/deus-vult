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

var possChurches = null;
var churching = false; // whether or not is building a church
var curPath = [];
var churchLoc = null;
var buildChurchTiles = null;

export default function pilgrimTurn () {
    //this.log("I am a Pilgrim at "+this.me.x+" "+this.me.y);
    //this.log("entering");
    var me=this.me;
    var minDR=-1;
    var minDRv=9999;
    if (this.me.turn==1) {
        if (vars.creatorPos!=null) {
            if ((vars.visibleRobotMap[vars.creatorPos[0]][vars.creatorPos[1]].signal & 1<<14) > 0) {
                attacking = true;
            }
        }

        resDirs=utils.findConnections.call(this, 30);

        for (var i=0; i<vars.rLocs.length; i++) {
            vars.rLocs[i].closed=-2000;
        }

        initPossChurches.call(this);
    }

    // going to build a church
    if (churching) {
      //this.log("churching "+churchLoc);

      // updates hasChurch
      hasCloseChurch.call();

      // if the churchLoc already has a church built at it, then reset stuff
      if (hasChurch[churchLoc[1]][churchLoc[0]]<=5) {
        var churchLoc = findBestChurch.call();
        if (churchLoc==null) {
          churching = false;
          return;
        }

        buildChurchTiles = utils.applyConnections.call(this, churchLoc, vars.buildable);
        curPath = [];
        if (this.me.time>1.2*vars.NAVIGATION_TIME_LIMIT) {
          var path = utils.navigate.call(this, [this.me.x, this.me.y], buildChurchTiles, vars.CHURCH_DEPTH);
          if (path!=null) {
            var move = path.splice(0, 1)[0];
            curPath = path;
            return this.move(move[0], move[1]);
          }
        }
      }

      // if next to the target church location, try to build the church
      if (curPath.length==0) {
        if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.CHURCH].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.CHURCH].CONSTRUCTION_FUEL) {
          if (vars.visibleRobotMap[churchLoc[1]][churchLoc[0]]<=0) {
            this.log("building church at "+this.me.x+" "+this.me.y)
            churching = false;
            return this.buildUnit(vars.SPECS.CHURCH, churchLoc[0]-this.me.x, churchLoc[1]-this.me.y);
          }
        }
        return;
      }

      // try to move along the current path towards building the church
      var move = curPath.splice(0, 1)[0];
      if (vars.visibleRobotMap[this.me.y+move[1]][this.me.x+move[0]] == 0) {
        return this.move(move[0], move[1])
      }

      // if the current path is blocked, try to find a new one
      curPath = [];
      if (this.me.time>1.2*vars.NAVIGATION_TIME_LIMIT) {
        var path = utils.navigate.call(this, [this.me.x, this.me.y], buildChurchTiles, vars.CHURCH_DEPTH);
        if (path!=null) {
          var move = path.splice(0, 1)[0];
          curPath = path;
          return this.move(move[0], move[1]);
        }
      }
    }

    if (attacking) {
        return pilgrim_atk.pilgrimAtkTurn.call(this);
    }

    //remove after testing
    if (vars.teamKarb>50 && vars.teamFuel>200) {
        var goods=newFactVal.call(this);
        var best=-9999;
        var bx=-1;
        var by=-1;
        for (var x=0; x<vars.xmax; x++) {
            for (var y=0; y<vars.ymax; y++) {
                if (goods[x][y]>best) {
                    best=goods[x][y];
                    bx=x;
                    by=y;
                }
            }
        }
        //this.log(bx+" "+by+" is the best new base");
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
    if (minDR!=-1) utils.soloBFS([vars.rLocs[minDR].x,vars.rLocs[minDR].y],10);
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
                facts.push(utils.soloBFS(utils.unhashCoordinates(h),20));
                pris.push(0);
            }
            //this.log(facts.length);

            return pickAdjMove.call(this,facts,pris);
        }
    }
    //go to resources [sometimes returns]
    if (vars.teamFuel>=4) {
        //this.log("To rloc");
        var openRecs=[];
        var pris=[];
        for (var i=0; i<vars.rLocs.length; i++) {
            var p=vars.rLocs[i];
            if ((p.x-me.x)**2 + (p.y-me.y)**2<200 && vars.fuzzyCost[p.x][p.y].length>0 && me.turn-p.closed>100) {
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
    //mine stuff [always returns]
    if (vars.teamFuel>=1 && (vars.karbMap[me.y][me.x] || vars.fuelMap[me.y][me.x])) {
        //this.log("Mined stuff");
        return this.mine();
    }
    //go build a church [sometimes returns]
    if (vars.teamKarb>50 && vars.teamFuel>200) {

        // FEEL FREE TO USE THIS AFTER SEEDING
        /*
        var goods=newFactVal.call(this);
        var best=-9999;
        var bx=-1;
        var by=-1;
        for (var x=0; x<vars.xmax; x++) {
            for (var y=0; y<vars.ymax; y++) {
                if (goods[x][y]>best) {
                    best=goods[x][y];
                    bx=x;
                    by=y;
                }
            }
        }
        this.log(bx+" "+by+" is the best new base");
        */

        churchLoc = findBestChurch.call(this);
        if (churchLoc!=null) {
          churching = true;
          this.log("churching to "+churchLoc);
          // all the tiles adjacent to churchLoc which are passable
          buildChurchTiles = utils.applyConnections.call(this, churchLoc, vars.buildable);
          // finds a path to build the church
          if (this.me.time>1.2*vars.NAVIGATION_TIME_LIMIT) {
            var path = utils.navigate.call(this, [this.me.x, this.me.y], buildChurchTiles, vars.CHURCH_DEPTH);
            if (path!=null) {
              var move = path.splice(0, 1)[0];
              curPath = path;
              return this.move(move[0], move[1]);
            }
            return;
          }
        }
    }

    return null;
}

var resDirs;
var factVals;

function newFactVal() {
    if (!vars.baseChange) {
        return factVals;
    }
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
    var bdist=utils.bfs(bases,4);
    //this.log(bdist[33][10]);
    for (var i=0; i<vars.rLocs.length; i++) {
        var rx=vars.rLocs[i].x;
        var ry=vars.rLocs[i].y;
        ret[rx][ry]-=10000;
        var val=(1+2*vars.rLocs[i].type)*80;
        if (bdist[rx][ry]==null) {
            for (var d=0; d<resDirs.length; d++) {
                if (utils.checkBounds(rx+resDirs[d][0],ry+resDirs[d][1])) {
                    ret[rx+resDirs[d][0]][ry+resDirs[d][1]]+=val-(resDirs[d][0]**2+resDirs[d][1]**2);
                }
            }
        }
    }
    //this.log('kek');
    factVals=ret;
    return ret;
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
        //this.castleTalk(bestd);
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
