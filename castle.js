import vars from './variables';
import * as utils from './utils';

var team;
var totC;

export default function castleTurn() {
  //this.log("I am a Castle at "+this.me.x+" "+this.me.y);
  //this.log("Resources: "+vars.firstTurn);
  if (vars.firstTurn) {
    var symmetry = utils.checkMapSymmetry(vars.passableMap, vars.karbMap, vars.fuelMap);
    this.log("VERTICAL: " + symmetry[0] + "; HORIZONTAL: " + symmetry[1]);
    //Castle information, first turn only
    //determine total number of castles
    //determine if enemy castles are visible and number
    //  try to determine if map is truly horizontal or vertical if symmetry returned both
    team = this.me.team;
    totC = vars.visibleRobots.length;
    for( var x = 0; x < totC; x++ ) {
      if( vars.visibleRobots[x].team != team ) {
        totC = totC-1;
      }
    }
    vars.firstTurn = false;
    //this.log("Test: " +vars.firstTurn);
  }

  //headcount 0: castle, 1: church, 2: pilgrim, 3: crusader, 4: prophet, 5: preacher
  var headcount = [0,0,0,0,0,0];
  for( var i = 0; i < vars.visibleRobots.length; i++ ) {
    if( vars.visibleRobots[i].team == team ) {
      var u = vars.visibleRobots[i].unit;
        if( u == vars.SPECS.CASTLE )
          headcount[0] += 1;
        if( u == vars.SPECS.CHURCH )
          headcount[1] += 1;
        if( u == vars.SPECS.PILGRIM )
          headcount[2] += 1;
        if( u == vars.SPECS.CRUSADER )
          headcount[3] += 1;
        if( u == vars.SPECS.PROPHET )
          headcount[4] += 1;
    }
  }

  if (this.karbonite >= 10 && this.fuel >= 50) {
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
        this.signal(i, vars.buildable[i][0]**2+vars.buildable[i][1]);
        this.log("Building pilgrim at "+x+" "+y);
        return this.buildUnit(vars.SPECS.PILGRIM, vars.buildable[i][0], vars.buildable[i][1]);
      }
    }
  }
}
