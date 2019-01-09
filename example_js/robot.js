import {BCAbstractRobot, SPECS} from 'battlecode';

// constants
var moveable = [];
var buildable = [];

// initialize once
var firstTurn = true;
var passableMap = null;
var karbMap = null;
var fuelMap = null;
var xmax;
var ymax;
var moveRadius;
var sightRadius;
var buildRadius;
var unitType;

// frequent updates
var turnCount = -1;
var visibleRobotMap = null;
var xpos = 0;
var ypos = 0;

class MyRobot extends BCAbstractRobot {
    turn() {
        try{

        visibleRobotMap = this.getVisibleRobotMap();
        xpos = this.me.x;
        ypos = this.me.y;

        if (firstTurn) {
            firstTurn = false;
            passableMap =  this.getPassableMap();
            karbMap = this.getKarboniteMap();
            fuelMap = this.getFuelMap();
            xmax = passableMap.length;
            ymax = passableMap[0].length;

            buildRadius = 2;
            switch (this.me.unit) {
                case SPECS.PILGRIM:
                    sightRadius = 100;
                    moveRadius = 4;
                    break;
                case SPECS.CRUSADER:
                    sightRadius = 36;
                    moveRadius = 9;
                    break;
                case SPECS.CASTLE:
                    sightRadius = 100;
                    moveRadius = 0;
                    break;
            }

            for (var x = 1; x <= Math.sqrt(moveRadius); x++) {
                for (var y = 0; y <= Math.sqrt(moveRadius); y++) {
                    if (x*x+y*y <= moveRadius) {
                        moveable.push([x, y]);
                        moveable.push([-x, -y]);
                        moveable.push([-x, y]);
                        moveable.push([x, -y]);
                    }
                }
            }

            for (var x = 1; x <= Math.sqrt(buildRadius); x++) {
                for (var y = 0; y <= Math.sqrt(buildRadius); y++) {
                    if (x*x+y*y <= buildRadius) {
                        buildable.push([x, y]);
                        buildable.push([-x, -y]);
                        buildable.push([-x, y]);
                        buildable.push([x, -y]);
                    }
                }
            }
             // this.log(buildable);
             // this.log(moveable);

        //end of init
        }

        switch (this.me.unit) {
            case SPECS.PILGRIM:
                return this.pilgrimTurn();
            case SPECS.CRUSADER:
                return this.crusaderTurn();
            case SPECS.CASTLE:
                return this.castleTurn();
        }
        }
        catch (err) {
            this.log("Error "+err);
        }
    }

    pilgrimTurn() {
        this.log("I am a Pilgrim at "+xpos+" "+ypos);
        if (this.fuel >= 50) {
            for (var i = 0; i < moveable.length; i++) {
                var x = this.me.x+moveable[i][0];
                var y = this.me.y+moveable[i][1];
                if (this.checkBounds(y, x)&&passableMap[y][x]&&visibleRobotMap[y][x]==0) {
                    this.log("Moving to "+x+" "+y);
                    return this.move(moveable[i][0], moveable[i][1]);
                }
            }
        }
    }

    crusaderTurn() {
        this.log("I am a Crusader at "+xpos+" "+ypos);
        var choice = moveable[Math.floor(Math.random()*moveable.length)];
        return this.move(choice);
    }

    castleTurn() {
        this.log("I am a Castle at "+xpos+" "+ypos);
        this.log("Resources: "+this.karbonite+" "+this.fuel);
        if (this.karbonite >= 10 && this.fuel >= 50) {
            for (var i = 0; i < buildable.length; i++) {
                var x = this.me.x+buildable[i][0];
                var y = this.me.y+buildable[i][1];
                if (this.checkBounds(y, x)&&passableMap[y][x]&&visibleRobotMap[y][x]==0) {
                    this.log("Building pilgrim at "+x+" "+y);
                    return this.buildUnit(SPECS.PILGRIM, buildable[i][0], buildable[i][1]);
                }
            }
        }
    }

    checkBounds(x, y) {
        return 0 <= x && x < xmax && 0 <= y && y < ymax;
    }

    astar() {

        prob
    }
}

var robot = new MyRobot();
