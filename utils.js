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
        vars.rLocs.push({type: 0, x: x, y: y});
      } else if (vars.karbMap[y][x]) {
        vars.rLocs.push({type: 1, x: x, y: y});
      }
    }
  }
}

export function checkBounds (x, y) {
  return 0 <= x && x < vars.xmax && 0 <= y && y < vars.ymax;
}

export function findMove (start, end) {
  if (vars.fuzzyCost[end[0]][end[1]].length==0) {
    vars.fuzzyCost[end[0]][end[1]] = bfs.call(this, [end]);
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
  var queue = [];
  for (var i = 0; i < ends.length; i++) {
    heappush(queue, [0, 0, ends[i]]);
    costs[ends[i][0]][ends[i][1]] = [0, 0];
  }
  var time = new Date().getTime();
  while (queue.length>0) {
    var state = heappop(queue);
    var curCost = [state[0], state[1]];
    if (costs[state[2][0]][state[2][1]]!=null && heapCompare(curCost, costs[state[2][0]][state[2][1]]) > 0) {
      continue;
    }
    for (var i = 0; i < vars.moveable.length; i++) {
      var x = state[2][0]+vars.moveable[i][0];
      var y = state[2][1]+vars.moveable[i][1];
      var newCost = [curCost[0]+1, curCost[1]+vars.moveCost*(vars.moveable[i][0]**2+vars.moveable[i][1]**2)];
      if (checkBounds(x, y)&&vars.passableMap[y][x]&&(costs[x][y]==null||heapCompare(newCost, costs[x][y])<0)) {
        heappush(queue, [newCost[0], newCost[1], [x, y]]);
        costs[x][y] = newCost;
      }
    }
  }
  this.log("BFS Time: "+(new Date().getTime()-time));
  return costs;
}

export function multiDest (ends) {
  return bfs.call(this, ends);
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
  reachable.sort(function(x, y) {
    return x[0]**2+x[1]**2-y[0]**2-y[1]**2;
  });
  //this.log(reachable);
  return reachable;
}

export function updateBaseLocs () {
  var shouldSee = {};
  for (var h in vars.baseLocs) {
    var pos = unhashCoordinates(h);
    if (vars.visibleRobotMap[pos[1]][pos[0]]>=0) {
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
  //this.log(vars.baseLocs);
}

export function hashCoordinates(pair) {
  return pair[0]*vars.ymax+pair[1];
}

export function unhashCoordinates(hashVal) {
  return [Math.floor(hashVal/vars.ymax), hashVal%vars.ymax];
}

export function heapCompare(v1, v2) {
  if (v1[0]==v2[0]) {
    return v1[1]-v2[1];
  }
  return v1[0]-v2[0];
}

export function heappush(array, val) {
  array.push(val);
  var pos = array.length-1;
  var parent = Math.floor((pos-1)/2);
  while (pos > 0) {
    if (heapCompare(array[pos], array[parent])<0) {
      var temp = array[pos];
      array[pos] = array[parent];
      array[parent] = temp;
    }
    else {
      break;
    }
    pos = parent;
    parent = Math.floor((pos-1)/2);
  }
}

export function heappop(array) {
  if (array.length==0) {
    throw "empty heap";
  }
  var ret = array[0];
  array[0] = array[array.length-1];
  var pos = 0;
  while (2*pos+1 < array.length) {
    var child;
    if (2*pos+2==array.length||heapCompare(array[2*pos+1], array[2*pos+2]) < 0) {
      child = 2*pos+1;
    }
    else {
      child = 2*pos+2;
    }
    if (heapCompare(array[pos], array[child]) > 0) {
      var temp = array[pos];
      array[pos] = array[child];
      array[child] = temp;
    }
    else {
      break;
    }
    pos = child;
  }
  array.splice(array.length-1, 1);
  return ret;
}
