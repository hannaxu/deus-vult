import vars from './variables';
import * as utils from './utils';

export function buildOpt(attackPos, deposits, unit, cx, cy) {
  var d = {};
  for(var i = 0; i < vars.buildable.length; i++) {
    //this.log(vars.buildable[i]);
    d[vars.buildable[i]] = 1;
  }
  for( var i = 0; i < deposits[1].length; i++ ) {
    d[deposits[1][i]] += (deposits[0]-i)*2;
  }
  for( var i = 0; i < deposits[2].length; i++ ) {
    d[deposits[2][i]] += deposits[0]-i;
  }
  //this.log(d);
  var pos = []
  for( var key in d ) {
    var temp = key.split(",").map(parseFloat);
    var x = cx+temp[1];
    var y = cy+temp[0];
    if (!(utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0)) {
      delete d[key];
    }
    else {
      pos.push([y, x])
    }
  }
  if( pos.length == 0 )
    return null;
  //this.log(pos);
  //if pilgrim, sort max is better, closest to opposite of attackPos
  //this.log(d);
  if( unit == vars.SPECS.PILGRIM ) {
    if( attackPos ) { //null for early game
      attackPos[0] = 2*cy-attackPos[0];
      attackPos[1] = 2*cx-attackPos[1];
      var temp = closestPos(pos, attackPos);
      return [temp[0]-cy, temp[1]-cx];
    }
    else {
      var build = [];
      for(var key in d) {
        build.push({
          name: key.split(",").map(parseFloat),
          value: d[key]
        });
      }
      build.sort(function(a, b){return b.value - a.value});
      //this.log(build);
      return build[0].name;
    }
  }
  //if attack, sort min is better, closest to attackPos
  else {
    if( attackPos ) { //enemy castle for early game
      var temp = closestPos(pos, attackPos);
      return [temp[0]-cy, temp[1]-cx];
    }
    else {
      var build = [];
      for(var key in d) {
        build.push({
          name: key.split(",").map(parseFloat),
          value: d[key]
        });
      }
      build.sort(function(a, b){return a.value - b.value});
      return build[0].name;
    }
  }
}
//possible locations, target position
function closestPos(pos, targetPos) {
  var dist = [];
  for(var i = 0; i < pos.length; i++) {
    var s = pos[i];
    dist.push({
      loc: s,
      value: (s[0]-targetPos[0])**2+(s[1]-targetPos[1])**2
    });
  }
  dist.sort(function(a, b){return a.value - b.value});
  return dist[0].loc;
}
export function resources(cx, cy) {
    //resource consideration
    var deposits = [0,[],[]];

    var di = 1;
    var dj = 0;
    var seg = 1;
    var i = cx;
    var j = cy;
    var segPass = 0;
    for (var k = 0; k < 100; ++k) {
      if( !(i < 0 || j < 0 || i >= vars.xmax || j >= vars.ymax) ) {
        if (vars.karbMap[j][i]) {
          deposits[0] += 1;
          deposits[1].push(transferPt([j,i], cx, cy));
        }
        if (vars.fuelMap[j][i]) {
          deposits[0] += 1;
          deposits[2].push(transferPt([j,i], cx, cy));
        }
      }
      i += di;
      j += dj;
      ++segPass;
      if (segPass == seg) {
        segPass = 0;
        var temp = di;
        di = -dj;
        dj = temp;
        if (dj == 0)
            ++seg;
      }
    }
    return deposits;
}

export function transferPt(coor, mx, my) {
    var y = coor[0]-my;
    if( y != 0 ) y = y/Math.abs(y);
    var x = coor[1]-mx;
    if( x != 0 ) x = x/Math.abs(x);
    return [y, x];
}

export function findVisibleEnemies (pos=[this.me.x, this.me.y]) {
  //this.log("hello");
  var ret = [];
  for (var i = 0; i < vars.visibleEnemyRobots.length; i++) {
    var dx = vars.visibleEnemyRobots[i].x-this.me.x;
    var dy = vars.visibleEnemyRobots[i].y-this.me.y;
    ret.push([dx, dy, vars.visibleEnemyRobots[i].unit]);
  }
  ret.sort(function(x, y) {
    return x[0]**2+x[1]**2-y[0]**2-y[1]**2;
  });
  return ret;
}

export function churchLoc(castleOrderAll, castleOrder, enemyCastles, myCastles, dConst) {
  var numC = castleOrderAll.length;
  var castleLoc = [];
  for( var i = 0; i < numC; i++ ) {
    castleLoc.push([myCastles[castleOrderAll[i]][0], myCastles[castleOrderAll[i]][1]]);
  }
  //this.log("helo");
  //this.log(castleLoc);
  var ret = [];
  var rlocs = vars.rLocs;
  //this.log(rlocs.length);
  for( var i = 0; i < rlocs.length; i++ ) {
    if(rlocs[i]["type"]) {
      var temp = true;
      for( var x = 0; x < ret.length; x++ ) {
        if( (rlocs[i]["x"]-ret[x][0])*(rlocs[i]["x"]-ret[x][0])+(rlocs[i]["y"]-ret[x][1])*(rlocs[i]["y"]-ret[x][1]) <= 25 ) {
          temp = false;
          break;
        }
      }
      if(temp)
          ret.push([rlocs[i]["x"], rlocs[i]["y"]]);
    }
  }
  //this.log(ret);
  var opt = [];
  //this.log(castleOrder);
  for( var i = 0; i < ret.length; i++ ) {
    var temp = nearestCastle(ret[i][0], ret[i][1], castleLoc, dConst);
    var temp1 = nearestCastle(ret[i][0], ret[i][1], enemyCastles, 5000);
    //this.log(temp);
    if( temp[0] == castleOrder && temp[1] > 16 && temp[1] < dConst && temp1[1] > 25 ) 
      opt.push(ret[i]);
  }
  this.log("Church loc optimum: " + JSON.stringify(opt));
  return opt.length; //{x, y}
}

export function buildPilgrim (defend, churchLoc, churching, visibleCount, deposits) {
  if( defend )
    return false;
  if( visibleCount[2] < Math.min(deposits[1].length+1, deposits[0]) )
    return true;
  if( visibleCount[4] >= 2 ) {
    if( visibleCount[2] < deposits[0] )
      return true;
    if( churchLoc > 0 && !churching )
      return null;
  }
  return false;
}

export function buildProphet(defend, totChurchLoc,  castleOrder, visibleCount, castleOrderAll, myCastles, unitTracking) {
  var units = [];
  var numC = castleOrderAll.length;
  var castleLoc = [];
  for( var i = 0; i < numC; i++ ) {
    units.push(0);
    castleLoc.push([myCastles[castleOrderAll[i]][0], myCastles[castleOrderAll[i]][1]]);
  }
  //this.log(castleLoc);
  var churchC = 0;
  if ( defend )
    return true;
  if( visibleCount[4] > 30 )
    return false;
  for( var key in unitTracking ) {
    if( unitTracking[key]["unit"] == vars.SPECS.PROPHET ) {
      var temp = nearestCastle(unitTracking[key]["x"], unitTracking[key]["y"], castleLoc, 100);
      //this.log(temp);
      if( temp[0] > -1 )
        units[temp[0]] += 1;
    }
    if( unitTracking[key]["unit"] == vars.SPECS.CHURCH ) 
      churchC++;
  }
  //this.log(units);
  var min = 5000;
  var minI = 0;
  for( var i = 0; i < units.length; i++ ) {
    if( units[i] <= min ) {
      min = units[i];
      minI = i;
    }
  }
  //this.log(units[castleOrder]);
  //this.log(min);
  if( Math.abs(units[castleOrder] - min) <= 1 ) {
    //this.log("build");
    if( visibleCount[4] < 2 )
      return true;
    if( visibleCount[4] < 12 && this.karbonite >= 65 && this.fuel >= 300 && totChurchLoc/2 < churchC )
      return true;
    if( visibleCount[4] < 7 && this.karbonite >= 50 && this.fuel >= 300 && this.me.turn > totChurchLoc*vars.ymax/2 )
      return true;
    if( churchC == Math.min(totChurchLoc, 1) && visibleCount[4] < 4 && vars.ymax < 48 && this.me.turn < 12 )
      return true;
  }
  if( this.karbonite >= 100 && this.fuel >= 300 )
      return true;
  if( this.me.turn > 980 )
    return true;
  return false;
}

function nearestCastle(ux, uy, castleLoc, min) {
  var minI = -1;
  for( var key = 0; key < castleLoc.length; key++ ) {
    var d = (castleLoc[key][0]-ux)*(castleLoc[key][0]-ux)+(castleLoc[key][1]-uy)*(castleLoc[key][1]-uy);
    if( d <= min ) {
      min = d;
      minI = key;
    }
  }
  return [minI, min];
}