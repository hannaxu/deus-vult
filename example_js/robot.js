import {BCAbstractRobot, SPECS} from 'battlecode';

// constants
const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

// initialize once
var first_turn = false;
var passableMap = null;
var karbMap = null;
var fuelMap = null;

// frequent updates
var step = -1;
var visibleRobotMap = null;

class MyRobot extends BCAbstractRobot {
    turn() {
        step++;
        if (first_turn) {
            first_turn = false;
            passableMap =  this.getPassableMap();
            karbMap = this.getKarboniteMap();
            fuelMap = this.getFuelMap();
        }
        visibleRobotMap = this.getVisibleRobotMap();
        switch (this.me.unit) {
            case SPECS.PILGRIM:
                return this.pilgrim_turn();
            case SPECS.CRUSADER:
                return this.crusader_turn();
            case SPECS.CASTLE:
                return this.castle_turn();
        }
    }

    pilgrim_turn() {
        const choice = choices[Math.floor(Math.random()*choices.length)];
        return this.move(...choice);
    }

    crusader_turn() {
        const choice = choices[Math.floor(Math.random()*choices.length)];
        return this.move(...choice);
    }

    castle_turn() {
        if (step % 10 === 0) {
            this.log("Building a pilgrim at " + (this.me.x+1) + ", " + (this.me.y+1));
            return this.buildUnit(SPECS.PILGRIM, 1, 1);
        }
        else {
            return // this.log("Castle health: " + this.me.health);
        }
    }
}

var robot = new MyRobot();
