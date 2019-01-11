import vars from './variables';

/**
 * Determine the map's symmetry from globally-known data.
 * @param   {bool[][]}  passMap The full map, result of this.map.
 * @param   {bool[][]}  karbMap The Karbonite map, result of this.fuel_map.
 * @param   {bool[][]}  fuelMap The Fuel map, result of this.fuel_map.
 * @returns {bool[]}            Array length 2, representing symmetry in the [vert, horiz] form.
 */
export function checkMapSymmetry (passMap, karbMap, fuelMap) {
  return [symmetry2DVert(passMap) && symmetry2DVert(karbMap) && symmetry2DVert(fuelMap),
    symmetry2DHoriz(passMap) && symmetry2DHoriz(karbMap) && symmetry2DHoriz(fuelMap)];
}
function symmetry2DVert (arr) {
  var N = arr[0].length;
  var leftFlipped = arr.map(function(row){return row.slice(0, Math.floor(N/2)).reverse()});
  var right = arr.map(function(row){return row.slice(Math.floor((N+1)/2))});
  return equal2D(leftFlipped, right);
}

function symmetry2DHoriz (arr) {
  var N = arr.length;
  var topFlipped = arr.slice(0, Math.floor(N/2)).reverse();
  var bottom = arr.slice(Math.floor((N+1)/2));
  return equal2D(topFlipped, bottom);
}

function equal2D (arr1, arr2) {
  for (var r = 0; r < arr1.length; r++) {
    for (var c = 0; c < arr1[0].length; c++) {
      if (arr1[r][c] != arr2[r][c]) {
        return false;
      }
    }
  }
  return true;
}

//type: 0 for fuel, 1 for karb
//x,y
//
//determine resource
export function initRecList () {
  for (var x=0; x<vars.xmax; x++) {
    for (var y=0; y<vars.ymax; y++) {
      if (vars.fuelMap[y][x]) {
        vars.rLocs.push({});
        vars.rLocs[vars.rLocs.length-1].type=0;
        vars.rLocs[vars.rLocs.length-1].x=x;
        vars.rLocs[vars.rLocs.length-1].y=y;
        vars.rLocs[vars.rLocs.length-1].lastFull=-500;
      } else if (vars.karbMap[y][x]) {
        vars.rLocs.push({});
        vars.rLocs[vars.rLocs.length-1].x=x;
        vars.rLocs[vars.rLocs.length-1].y=y;
        vars.rLocs[vars.rLocs.length-1].lastFull=-500;
      }
    }
  }
}

export function checkBounds (x, y) {
  return 0 <= x && x < vars.xmax && 0 <= y && y < vars.ymax;
}

export function findMove (start, end) {
  if (vars.fuzzyCost[end[0]][end[1]].length==0) {
    vars.fuzzyCost[end[0]][end[1]] = bfs([end]);
    //this.log("Conducted bfs "+start+" "+end);
  }
  if (vars.fuzzyCost[end[0]][end[1]][start[0]][start[1]]==null) {
    return null;
  }
  var bestMove = [vars.fuzzyCost[end[0]][end[1]][start[0]][start[1]][0], vars.fuzzyCost[end[0]][end[1]][start[0]][start[1]][1], null];
  for (var i = 0; i < vars.moveable.length; i++) {
    var x = start[0]+vars.moveable[i][0];
    var y = start[1]+vars.moveable[i][1];
    if (checkBounds(x, y)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
      var move = vars.fuzzyCost[end[0]][end[1]][x][y];
      if (move[0]<bestMove[0]) {
        bestMove = [move[0], move[1], vars.moveable[i]];
      }
      else if (move[0]==bestMove[0]&&move[1]<bestMove[0]) {
        bestMove = [move[0], move[1], vars.moveable[i]];
      }
    }
  }
  return bestMove[2];
}

//list of [x,y]
export function bfs (ends) {
  var costs = []
  for (var x = 0; x < vars.xmax; x++) {
    costs.push([]);
    for (var y = 0; y < vars.ymax; y++) {
      costs[x].push(null);
    }
  }
  var index = 0;
  var queue = [];
  for (var i = 0; i < ends.length; i++) {
    queue.push(ends[i]);
    costs[ends[i][0]][ends[i][1]] = [0, 0];
  }
  while (index<queue.length) {
    //this.log("q "+queue[index]);
    var curCost = costs[queue[index][0]][queue[index][1]];
    for (var i = 0; i < vars.moveable.length; i++) {
      var x = queue[index][0]+vars.moveable[i][0];
      var y = queue[index][1]+vars.moveable[i][1];
      if (checkBounds(x, y)&&vars.passableMap[y][x]&&costs[x][y]==null) {
        queue.push([x, y]);
        costs[x][y] = [curCost[0]+1, curCost[1]+vars.moveCost*(vars.moveable[i][0]**2+vars.moveable[i][1]**2)];
      }
    }
    index++;
  }
  return costs;
}

export function multiDest (ends) {
  return bfs(ends);
}

export function findConnections (r2) {
  var reachable = [];
  for (var x = 1; x*x <= r2; x++) {
    for (var y = 0; y*y <= r2; y++) {
      if (x*x+y*y <= r2) {
        reachable.push([x, y]);
        reachable.push([-x, -y]);
        reachable.push([-y, x]);
        reachable.push([y, -x]);
      }
    }
  }
  return reachable;
}

export function updateBaseLocs () {
  var shouldSee = {};
  for (var h in vars.baseLocs) {
    var pos = unhashCoordinates(h);
    if (vars.visibleRobotMap[pos[1]][pos[0]]>0) {
      shouldSee[h] = 0;
    }
  }
  for (var i = 0; i < vars.visibleRobots.length; i++) {
    if (vars.visibleRobots[i].unit==vars.SPECS.CASTLE||vars.visibleRobots[i].unit==vars.SPECS.CHURCH) {
      var hashVal = hashCoordinates([vars.visibleRobots[i].x, vars.visibleRobots[i].y]);
      if (shouldSee[hashVal]==0) {
        delete shouldSee[hashVal];
      }
      else {
        vars.baseLocs[hashVal] = 0;
      }
    }
  }
  for (var h in shouldSee) {
    delete vars.baseLocs[h];
  }
  this.log(vars.baseLocs);
}

export function hashCoordinates(pair) {
  return pair[0]*vars.ymax+pair[1];
}

export function unhashCoordinates(hashVal) {
  return [Math.floor(hashVal/vars.ymax), hashVal%vars.ymax];
}
