import vars from '../variables';
import * as utils from '../utils';
import { sendMessage } from '../communication';

var deposits = 0;
var buildCount = [0,0,0,0,0,0];
var team;

export default function castleTurn() {
  //this.log("I am a Church at "+this.me.x+" "+this.me.y);
  //this.log("Resources: "+this.karbonite+" "+this.fuel);
  if (vars.firstTurn) {
    team = this.me.team;

    var lowX = this.me.x-2;
    var lowY = this.me.y-2;
    var highX = lowX+4;
    var highY = lowY+4;
    if( lowX < 0 ) lowX = 0;
    if( lowY < 0 ) lowY = 0;
    if( highX > vars.xmax ) highX = vars.xmax;
    if( highY > vars.ymax ) highY = vars.ymax;

    for (var x=lowX; x<highX; x++) {
      for (var y=lowY; y<highY; y++) {
        if (vars.fuelMap[y][x]) {
          deposits += 1;
        }
        if (vars.karbMap[y][x]) {
          deposits += 1;
        }
      }
    }
    vars.firstTurn = false;
  }

  var closePilgrim = 0;
  for( var i = 0; i < vars.visibleRobots.length; i++ ) {
    if( vars.visibleRobots[i].team == team )
      if( vars.visibleRobots[i].unit == vars.SPECS.PILGRIM )
        closePilgrim += 1;
  }

  if (this.karbonite >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_KARBONITE && this.fuel >= vars.SPECS.UNITS[vars.SPECS.PILGRIM].CONSTRUCTION_FUEL) {
    if ((closePilgrim < deposits)) {
      for (var i = 0; i < vars.buildable.length; i++) {
        var x = this.me.x+vars.buildable[i][0];
        var y = this.me.y+vars.buildable[i][1];
        if (utils.checkBounds(y, x)&&vars.passableMap[y][x]&&vars.visibleRobotMap[y][x]==0) {
          sendMessage.call(this, i, vars.buildable[i][0]**2+vars.buildable[i][1]**2);
          //this.log("Building pilgrim at "+x+" "+y);
          buildCount[2]++;
          return this.buildUnit(vars.SPECS.PILGRIM, vars.buildable[i][0], vars.buildable[i][1]);
        }
      }
    }
  }
}
