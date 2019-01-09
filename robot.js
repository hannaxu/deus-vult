import {BCAbstractRobot, SPECS} from 'battlecode';
import castleTurn from './castle';
import crusaderTurn from './crusader';
import pilgrimTurn from './pilgrim';

class MyRobot extends BCAbstractRobot {
    
    constructor() {
        super();

        // constants
        this.SPECS = SPECS;
        this.moveable = [];
        this.buildable = [];

        // initialize once
        this.firstTurn = true;
        this.passableMap = null;
        this.karbMap = null;
        this.fuelMap = null;
        this.xmax;
        this.ymax;
        this.moveRadius;
        this.sightRadius;
        this.buildRadius;
        this.unitType;

        // frequent updates
        this.turnCount = -1;
        this.visibleRobotMap = null;
        this.xpos = 0;
        this.ypos = 0;
    }
    
    turn() {
        try{

        this.visibleRobotMap = this.getVisibleRobotMap();
        this.xpos = this.me.x;
        this.ypos = this.me.y;

        if (this.firstTurn) {
            this.firstTurn = false;
            this.passableMap =  this.getPassableMap();
            this.karbMap = this.getKarboniteMap();
            this.fuelMap = this.getFuelMap();
            this.xmax = this.passableMap.length;
            this.ymax = this.passableMap[0].length;

            this.buildRadius = 2;
            switch (this.me.unit) {
                case this.SPECS.PILGRIM:
                    this.sightRadius = 100;
                    this.moveRadius = 4;
                    break;
                case this.SPECS.CRUSADER:
                    this.sightRadius = 36;
                    this.moveRadius = 9;
                    break;
                case this.SPECS.CASTLE:
                    this.sightRadius = 100;
                    this.moveRadius = 0;
                    break;
            }

            for (var x = 1; x <= Math.sqrt(this.moveRadius); x++) {
                for (var y = 0; y <= Math.sqrt(this.moveRadius); y++) {
                    if (x*x+y*y <= this.moveRadius) {
                        this.moveable.push([x, y]);
                        this.moveable.push([-x, -y]);
                        this.moveable.push([-x, y]);
                        this.moveable.push([x, -y]);
                    }
                }
            }

            for (var x = 1; x <= Math.sqrt(this.buildRadius); x++) {
                for (var y = 0; y <= Math.sqrt(this.buildRadius); y++) {
                    if (x*x+y*y <= this.buildRadius) {
                        this.buildable.push([x, y]);
                        this.buildable.push([-x, -y]);
                        this.buildable.push([-x, y]);
                        this.buildable.push([x, -y]);
                    }
                }
            }
            //this.log(this.buildable);
            //this.log(this.moveable);

        //end of init
        }

        switch (this.me.unit) {
            case this.SPECS.PILGRIM:
                return this.pilgrimTurn();
            case this.SPECS.CRUSADER:
                return this.crusaderTurn();
            case this.SPECS.CASTLE:
                return this.castleTurn();
        }
        }
        catch (err) {
            this.log("Error "+err);
        }
    }

    checkBounds(x, y) {
        return 0 <= x && x < this.xmax && 0 <= y && y < this.ymax;
    }

    astar() {
        //prob
    }
}

MyRobot.prototype.castleTurn = castleTurn;
MyRobot.prototype.crusaderTurn = crusaderTurn;
MyRobot.prototype.pilgrimTurn = pilgrimTurn;

var robot = new MyRobot();