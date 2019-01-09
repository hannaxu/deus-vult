export default {
    // initialize once
    SPECS: null,
    moveable: [],
    buildable: [],
    firstTurn: true,
    passableMap: null,
    karbMap: null,
    fuelMap: null,
    xmax: null,
    ymax: null,
    moveRadius: null,
    sightRadius: null,
    buildRadius: null,
    unitType: null,

    // frequent updates
    turnCount: -1,
    visibleRobotMap: null,
    xpos: 0,
    ypos: 0,
};