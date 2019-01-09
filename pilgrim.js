export default function pilgrimTurn () {
  this.log("I am a Pilgrim at "+this.me.x+" "+this.me.y);


  if (this.me.karbonite==20) {
    this.log("I have full karbonite");
    for (var i = 0; i < this.buildable.length; i++) {
      var x = this.me.x+this.buildable[i][0];
      var y = this.me.y+this.buildable[i][1];
      if (!this.checkBounds(x, y)) continue;
      var id = this.getRobot(this.visibleRobotMap[y][x]);
      if (id==null) continue;
      if (id.unit==this.SPECS.CASTLE) {
        this.log("Depositing karbonite");
        return this.give(this.buildable[i][0], this.buildable[i][1], this.me.karbonite, this.me.fuel);
      }
    }
    this.log("Not next to a castle");
    var choice = this.findMove([this.me.x, this.me.y], this.creatorPos);
    if (choice==null) {
      this.log("Trying to move to "+end+" but stuck");
    }
    this.log("Moving "+choice+" to "+this.creatorPos);
    return this.move(choice[0], choice[1]);
  }

  if (this.karbMap[this.me.y][this.me.x]) {
    this.log("Mining at "+this.me.x+" "+this.me.y);
    return this.mine();
  }

  var end = [0, 0];
  for (var x = 0; x < this.xmax; x++) {
    for (var y = 0; y < this.ymax; y++) {
      if (this.karbMap[y][x]) {
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

  // if (this.fuel >= 50) {
  //   for (var i = 0; i < this.moveable.length; i++) {
  //     var x = this.me.x+this.moveable[i][0];
  //     var y = this.me.y+this.moveable[i][1];
  //     if (this.checkBounds(x, y)&&this.passableMap[y][x]&&this.visibleRobotMap[y][x]==0) {
  //       this.log("Moving to "+x+" "+y);
  //       return this.move(this.moveable[i][0], this.moveable[i][1]);
  //     }
  //   }
  // }
}
