import vars from './variables';

export default function pilgrimTurn () {
  this.log("I am a Pilgrim at "+this.me.x+" "+this.me.y);

  if (this.me.karbonite==20) {
    this.log("I have full karbonite");
    for (var i = 0; i < vars.buildable.length; i++) {
      var x = this.me.x+vars.buildable[i][0];
      var y = this.me.y+vars.buildable[i][1];
      if (!this.checkBounds(x, y)) continue;
      var id = this.getRobot(vars.visibleRobotMap[y][x]);
      if (id==null) continue;
      if (id.unit==vars.SPECS.CASTLE) {
        this.log("Depositing karbonite");
        return this.give(vars.buildable[i][0], vars.buildable[i][1], this.me.karbonite, this.me.fuel);
      }
    }
    this.log("Not next to a castle");
    var choice = this.findMove([this.me.x, this.me.y], vars.creatorPos);
    if (choice==null) {
      this.log("Trying to move to "+end+" but stuck");
    }
    this.log("Moving "+choice+" to "+this.creatorPos);
    return this.move(choice[0], choice[1]);
  }

  if (vars.karbMap[this.me.y][this.me.x]) {
    this.log("Mining at "+this.me.x+" "+this.me.y);
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

  var choice = this.findMove([this.me.x, this.me.y], end);
  if (choice==null) {
    this.log("Trying to move to "+end+" but stuck");
  }
  else {
    this.log("Moving "+choice+" to "+end);
    return this.move(choice[0], choice[1]);
  }
}
