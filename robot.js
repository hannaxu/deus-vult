import {BCAbstractRobot, SPECS} from 'battlecode';

import vars from './variables';

import castleTurn from './castle';
import crusaderTurn from './crusader';
import pilgrimTurn from './pilgrim';

class MyRobot extends BCAbstractRobot {
    
    constructor() {
        super();
        vars.SPECS = SPECS;
    }
    
    turn() {
        try{

        vars.visibleRobotMap = this.getVisibleRobotMap();
        vars.xpos = this.me.x;
        vars.ypos = this.me.y;

        if (vars.firstTurn) {
            vars.firstTurn = false;
            vars.passableMap =  this.getPassableMap();
            vars.karbMap = this.getKarboniteMap();
            vars.fuelMap = this.getFuelMap();
            vars.xmax = vars.passableMap.length;
            vars.ymax = vars.passableMap[0].length;

            vars.buildRadius = 2;
            switch (this.me.unit) {
                case vars.SPECS.PILGRIM:
                    vars.sightRadius = 100;
                    vars.moveRadius = 4;
                    break;
                case vars.SPECS.CRUSADER:
                    vars.sightRadius = 36;
                    vars.moveRadius = 9;
                    break;
                case vars.SPECS.CASTLE:
                    vars.sightRadius = 100;
                    vars.moveRadius = 0;
                    break;
            }

            for (var x = 1; x <= Math.sqrt(vars.moveRadius); x++) {
                for (var y = 0; y <= Math.sqrt(vars.moveRadius); y++) {
                    if (x*x+y*y <= vars.moveRadius) {
                        vars.moveable.push([x, y]);
                        vars.moveable.push([-x, -y]);
                        vars.moveable.push([-x, y]);
                        vars.moveable.push([x, -y]);
                    }
                }
            }

            for (var x = 1; x <= Math.sqrt(vars.buildRadius); x++) {
                for (var y = 0; y <= Math.sqrt(vars.buildRadius); y++) {
                    if (x*x+y*y <= vars.buildRadius) {
                        vars.buildable.push([x, y]);
                        vars.buildable.push([-x, -y]);
                        vars.buildable.push([-x, y]);
                        vars.buildable.push([x, -y]);
                    }
                }
            }
            //this.log(vars.buildable);
            //this.log(vars.moveable);

        //end of init
        }

        switch (this.me.unit) {
            case vars.SPECS.PILGRIM:
                return this.pilgrimTurn();
            case vars.SPECS.CRUSADER:
                return this.crusaderTurn();
            case vars.SPECS.CASTLE:
                return this.castleTurn();
        }
        }
        catch (err) {
            this.log("Error "+err);
        }
    }

    checkBounds(x, y) {
        return 0 <= x && x < vars.xmax && 0 <= y && y < vars.ymax;
    }

    astar() {
        //prob
    }
}

MyRobot.prototype.castleTurn = castleTurn;
MyRobot.prototype.crusaderTurn = crusaderTurn;
MyRobot.prototype.pilgrimTurn = pilgrimTurn;

var robot = new MyRobot();