import vars from './variables';
import * as utils from './utils';

export default function pilgrimTurn () {

  this.log("I am a Pilgrim at "+this.me.x+" "+this.me.y);

  if (this.me.karbonite==vars.maxKarb) {
    //this.log("I have full karbonite");
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (!utils.checkBounds(x, y)) continue;
      var id = this.getRobot(vars.visibleRobotMap[y][x]);
      if (id==null) continue;
      if (id.unit==vars.SPECS.CASTLE) {
        //this.log("Depositing karbonite");
        return this.give(vars.buildable[i][0], vars.buildable[i][1], this.me.karbonite, this.me.fuel);
      }
    }
    //this.log("Not next to a castle");
<<<<<<< HEAD

    var base = null;
    for (var b in vars.baseLocs) {
      base = utils.unhashCoordinates(b);
    }
    this.log(base);
    var choice = utils.findMove.call(this, [this.me.x, this.me.y], base);
=======
    var choice = utils.findMove.call(this, [this.me.x, this.me.y], vars.creatorPos);
>>>>>>> f7eab13c59d3eedad6619bb5744467c6b0baab8b
    if (choice==null) {
      //this.log("Trying to move to "+vars.creatorPos+" but stuck");
      return;
    }
    else {
      //this.log("Moving "+choice+" to "+vars.creatorPos);
      return this.move(choice[0], choice[1]);
    }
  }

  if (vars.karbMap[this.me.y][this.me.x]) {
    //this.log("Mining at "+this.me.x+" "+this.me.y);
    return this.mine();
  }

  var end = [0, 0];

  for (var x = 0; x < vars.xmax; x++) {
    for (var y = 0; y < vars.ymax; y++) {
      if (vars.karbMap[y][x]) {
        end = [x, y];
      }
    }
  }

  var choice = utils.findMove.call(this, [this.me.x, this.me.y], end);
  if (choice==null) {
    //this.log("Trying to move to "+end+" but stuck");
  }
  else {
    //this.log("Moving "+choice+" to "+end);
    return this.move(choice[0], choice[1]);
  }
}
