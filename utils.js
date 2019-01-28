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

export function findMove (start, costs) {
  if (costs==null) {
    throw "COSTS ARE NULL FINDMOVE()";
  }
  if (costs[start[0]][start[1]]==null) {
    throw "occupied";
  }
  var bestMove = [costs[start[0]][start[1]][0], costs[start[0]][start[1]][1], null];
  for (var i = 0; i < vars.moveable.length; i++) {
    var x = start[0]+vars.moveable[i][0];
    var y = start[1]+vars.moveable[i][1];
    if (checkBounds(x, y)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
      var move = costs[x][y];
      if (move!=null&&move[0]<bestMove[0]) {
        bestMove = [move[0], move[1], vars.moveable[i]];
      }
    }
  }
  return bestMove[2];
}


export function findMoveD (start, end) {
  if (vars.fuzzyCost[end[0]][end[1]].length==0) {
    vars.fuzzyCost[end[0]][end[1]] = djikstra.call(this, [end]);
    //this.log("Conducted djikstra "+start+" "+end);
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
      else if (move[0]==bestMove[0]&&move[1]<bestMove[1]) {
        bestMove = [move[0], move[1], vars.moveable[i]];
      }
    }
  }
  return bestMove[2];
}

export function soloBFS(end,maxDepth) {
    if (vars.fuzzyCost[end[0]][end[1]].length==0) {
    vars.fuzzyCost[end[0]][end[1]] = bfs.call(this, [end],maxDepth);
  }
    return vars.fuzzyCost[end[0]][end[1]]
}

export function bfs (ends,maxdist) {
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
    if (curCost[0]<maxdist) {
      for (var i = 0; i < vars.moveable.length; i++) {
        var x = queue[index][0]+vars.moveable[i][0];
        var y = queue[index][1]+vars.moveable[i][1];
        if (checkBounds(x, y)&&vars.passableMap[y][x]&&(costs[x][y]==null || costs[x][y][0]>curCost[0] && costs[x][y][1]>curCost[1]+vars.moveCost*(vars.moveable[i][0]**2+vars.moveable[i][1]**2))) {
            if (costs[x][y]==null) {
                queue.push([x, y]);
            }
          costs[x][y] = [curCost[0]+1, curCost[1]+vars.moveCost*(vars.moveable[i][0]**2+vars.moveable[i][1]**2)];
        }
      }
    }
    index++;
  }
  return costs;
}

export function bfs2 (ends, maxDepth, start=[-1, -1], avoidObstacles=false) {
  var costs = [];
  for (var x = 0; x < vars.xmax; x++) {
    costs.push([]);
    for (var y = 0; y < vars.ymax; y++) {
      costs[x].push(null);
    }
  }
  var foundDepth = vars.POS_INF;
  var index = 0;
  var queue = [];
  for (var i = 0; i < ends.length; i++) {
    queue.push(ends[i]);
    costs[ends[i][0]][ends[i][1]] = [0, 0];
  }

  var time = new Date().getTime();
  while (index<queue.length) {
    if (new Date().getTime()-time>vars.NAVIGATION_TIME_LIMIT) {
      this.log("Out of time for navigation");
      return costs;
    }
    //this.log("q "+queue[index]);
    var curCost = costs[queue[index][0]][queue[index][1]];
    if (curCost[0]>Math.min(maxDepth, foundDepth)) {
      break;
    }
    if (equalArrays(start, queue[index])) {
      foundDepth = curCost[0];
    }
    for (var i = 0; i < vars.moveable.length; i++) {
      var x = queue[index][0]+vars.moveable[i][0];
      var y = queue[index][1]+vars.moveable[i][1];
      var empty = checkBounds(x, y) && vars.passableMap[y][x] && (!avoidObstacles || (vars.visibleRobotMap[y][x]<=0 || vars.visibleRobotMap[y][x]==this.me.id));
      if (empty&&costs[x][y]==null) {
        queue.push([x, y]);
        costs[x][y] = [curCost[0]+1, curCost[1]+vars.moveCost*(vars.moveable[i][0]**2+vars.moveable[i][1]**2)];
      }
    }
    index++;
  }
  return costs;
}

//list of [x,y]
export function djikstra (ends) {
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
  //this.log("BFS Time: "+(timeLeft.call(this)));
  return costs;
}

// not actually astar its just djikstra that navigates around robots
// TODO incremental changes to path
export function navigate(start, ends, maxDepth=vars.POS_INF, radius=vars.moveRadius) {
  if (ends.length==0) {
    return null;
  }
  var ret = {};
  for (var i = 0; i < ends.length; i++) {
    ret[hashCoordinates(ends[i])] = 0;
  }
  var parents = {};
  var costs = {}
  var queue = [];
  heappush(queue, [0, 0, start]);
  costs[hashCoordinates(start)] = [0, 0];
  parents[hashCoordinates(start)] = null;
  // this.log(ends);

  var time = new Date().getTime();
  outer: while (queue.length>0) {
    if (new Date().getTime()-time>vars.NAVIGATION_TIME_LIMIT) {
      this.log("Out of time for navigation");
      return null;
    }
    var state = heappop(queue);
    var pos = state[2];
    var curHash = hashCoordinates(pos);
    var curCost = costs[curHash];

    if (ret[curHash]!=null) {
      var path = [];
      var p = curHash;
      while (p!=hashCoordinates(start)) {
        var cPos = unhashCoordinates(p); // final
        var pPos = unhashCoordinates(parents[p]); // second to last
        path.push([cPos[0]-pPos[0], cPos[1]-pPos[1]]);
        p = parents[p];
      }
      return path.reverse();
    }

    if (curCost[0]<maxDepth) {
      for (var i = 0; i < vars.moveable.length; i++) {
        var x = pos[0]+vars.moveable[i][0];
        var y = pos[1]+vars.moveable[i][1];
        var newHash = hashCoordinates([x, y]);
        var newCost = [curCost[0]+1, curCost[1]+vars.moveCost*(vars.moveable[i][0]**2+vars.moveable[i][1]**2)];
        var prevCost = costs[newHash];
        var empty = checkBounds(x, y)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]<=0;
        if (empty&&(prevCost==null||heapCompare(newCost, prevCost)<0)) {
          heappush(queue, [newCost[0], newCost[1], [x, y]]);
          costs[newHash] = newCost;
          parents[newHash] = curHash;
        }
      }
    }
  }
  return null;
}

export function equalArrays(arr1, arr2) {
  if (arr1.length!=arr2.length) {
    return false;
  }
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i]!=arr2[i]) {
      return false;
    }
  }
  return true;
}

export function multiDest (ends) {
  throw "DEPRECATED";
  return bfs.call(this, ends);
}

export function findAllAttackable() {
  for (var u = 0; u < 6; u++) {
    var range = vars.SPECS.UNITS[u].ATTACK_RADIUS;
    vars.allAttackable.push([]);
    if (range!=null) {
      for (var x = 1; x*x <= range[1]; x++) {
        for (var y = 0; y*y <= range[1]; y++) {
          if (range[0] <= x*x+y*y && x*x+y*y <= range[1]) {
            vars.allAttackable[u].push([x, y]);
            vars.allAttackable[u].push([-x, -y]);
            vars.allAttackable[u].push([-y, x]);
            vars.allAttackable[u].push([y, -x]);
          }
        }
      }
      vars.allAttackable[u].sort(function(x, y) {
        return x[0]**2+x[1]**2-y[0]**2-y[1]**2;
      });
    }
  }
}

export function findConnections (r2) {
  if (vars.connections[r2] != null) {
    return vars.connections[r2];
  }
  vars.connections[r2] = [];
  for (var x = 1; x*x <= r2; x++) {
    for (var y = 0; x*x+y*y <= r2; y++) {
      vars.connections[r2].push([x, y]);
      vars.connections[r2].push([-x, -y]);
      vars.connections[r2].push([-y, x]);
      vars.connections[r2].push([y, -x]);
    }
  }
  vars.connections[r2].sort(function(x, y) {
    return x[0]**2+x[1]**2-y[0]**2-y[1]**2;
  });
  //this.log(vars.connections[r2]);
  return vars.connections[r2];
}

export function applyConnections (pos, connections) {
  var ret = [];
  for (var i = 0; i < connections.length; i++) {
    var x = pos[0]+connections[i][0];
    var y = pos[1]+connections[i][1];
    if (checkBounds(x, y)&&vars.passableMap[y][x]) {
      ret.push([x, y]);
    }
  }
  return ret;
}

export function connIndexOf (conn, val) {
  for (var i = 0; i < conn.length; i++) {
    if (conn[i][0]==val[0]&&conn[i][1]==val[1]) {
      return i;
    }
  }
  throw "ERROR Not in connection";
  return -1;
}

export function updateLocs () {
  for (var h in vars.baseLocs) {
    var pos = unhashCoordinates(h);
      var id=vars.visibleRobotMap[pos[1]][pos[0]];
    if (id>=0 && (id==0 || this.getRobot(id).unit>=2)) {
      delete vars.baseLocs[h];
        vars.baseChange=true;
    }
  }
  for (var i = 0; i < vars.visibleRobots.length; i++) {
    if (vars.visibleRobots[i].team==this.me.team && (vars.visibleRobots[i].unit==vars.SPECS.CASTLE||vars.visibleRobots[i].unit==vars.SPECS.CHURCH)) {
      var hashVal = hashCoordinates([vars.visibleRobots[i].x, vars.visibleRobots[i].y]);

      if (! (hashVal in vars.baseLocs)) {
           vars.baseLocs[hashVal] = vars.visibleRobots[i].id;
          vars.baseChange=true;
      }
    }
  }
  // castleLocs
  var shouldSee = {};
  for (var h in vars.castleLocs) {
    var pos = unhashCoordinates(h);
    if (vars.visibleRobotMap[pos[1]][pos[0]]>=0) {
      shouldSee[h] = vars.visibleRobotMap[pos[1]][pos[0]];
    }
  }
  for (var i = 0; i < vars.visibleRobots.length; i++) {
    if (vars.visibleRobots[i].unit==vars.SPECS.CASTLE) {
      var hashVal = hashCoordinates([vars.visibleRobots[i].x, vars.visibleRobots[i].y]);
      if (shouldSee[hashVal]==0) {
        delete shouldSee[hashVal];
      }
      else {
        vars.castleLocs[hashVal] = vars.visibleRobots[i].id;
      }
    }
  }
  for (var h in shouldSee) {
    delete vars.castleLocs[h];
  }
  //this.log(vars.baseLocs);
}

export function hashCoordinates(pair) {
  return pair[0]*vars.ymax+pair[1];
}

export function unhashCoordinates(hashVal) {
  return [Math.floor(hashVal/vars.ymax), hashVal%vars.ymax];
}

export function heapTest() {
  var func = function (v1, v2) {
    if (v1[1]==v2[1]) {
      return v1[0]-v2[0];
    }
    return v1[1]-v2[1];
  }
  var queue = [];
  var poss = [];
  for (var x = 0; x < 10; x++) {
    for (var y = 0; y < 10; y++) {
      poss.push([x, y]);
    }
  }
  var testing = 15;
  for (var i = 0; i < testing; i++) {
    heappush(queue, poss[Math.floor(Math.random()*poss.length)], func);
  }
  for (var i = 0; i < testing; i++) {
    this.log(heappop(queue, func));
  }
}

export function heapCompare(v1, v2) {
  if (v1[0]==v2[0]) {
    return v1[1]-v2[1];
  }
  return v1[0]-v2[0];
}

export function heappush(array, val, compare=heapCompare) {
  array.push(val);
  var pos = array.length-1;
  var parent = Math.floor((pos-1)/2);
  while (pos > 0) {
    if (compare(array[pos], array[parent])<0) {
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

export function heappop(array, compare=heapCompare) {
  if (array.length==0) {
    throw "empty heap";
  }
  var ret = array[0];
  array[0] = array[array.length-1];
  var pos = 0;
  while (2*pos+1 < array.length) {
    var child;
    if (2*pos+2==array.length||compare(array[2*pos+1], array[2*pos+2]) < 0) {
      child = 2*pos+1;
    }
    else {
      child = 2*pos+2;
    }
    if (compare(array[pos], array[child]) > 0) {
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

export function add (v1, v2) {
  return [v1[0]+v2[0], v1[1]+v2[1]];
}

export function onLattice (x, y) {
  var dx = Math.abs(x-vars.creatorPos[0]);
  var dy = Math.abs(y-vars.creatorPos[1]);
  if (dx>dy) {
    var temp = dx;
    dx = dy;
    dy = temp;
  }
  // dx <= dy
  if (dx<=2) {
    return dy%2==0;
  }
  else {
    return (dx+dy)%2==0;
  }
}

export function findAttackableEnemies (pos=[this.me.x, this.me.y], range=vars.attackRadius) {
  var ret = [];
  for (var i = 0; i < vars.visibleEnemyRobots.length; i++) {
    var dx = vars.visibleEnemyRobots[i].x-this.me.x;
    var dy = vars.visibleEnemyRobots[i].y-this.me.y;
    if (range[0]<=dx**2+dy**2&&dx**2+dy**2<=range[1]) {
      ret.push(vars.visibleEnemyRobots[i]);
    }
  }
  orderEnemies.call(this, ret);
  return ret;
}

export function canHitMe (enemy) {
  var range = vars.SPECS.UNITS[enemy.unit].ATTACK_RADIUS;
  var dist = (vars.xpos-enemy.x)**2+(vars.ypos-enemy.y)**2;
  return range!=null && range[0] <= dist && dist <= range[1];
}

export function orderEnemies (list) {
  list.sort(function(r1, r2) {
    if (canHitMe(r1)!=canHitMe(r2)) {
      if (canHitMe(r1)) {
        return -1;
      }
      return 1;
    }
    if (r1.unit!=r2.unit) {
      return vars.ENEMY_PRIORITY.indexOf(r1.unit)-vars.ENEMY_PRIORITY.indexOf(r2.unit);
    }
    return (r1.x-vars.xpos)**2+(r1.y-vars.ypos)**2+(r2.x-vars.xpos)**2+(r2.y-vars.ypos)**2;
  });
}

export function timeLeft () {
  return this.me.time-(new Date().getTime()-vars.turnStartTime);
}

export function random() {
  var seed = 1;
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}
