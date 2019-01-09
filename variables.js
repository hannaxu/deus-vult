export default {
    // constants
    POS_INF: 2147483647,
    NEG_INF: -2147483648,

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
    moveCost: null,
    unitType: null,
    creatorPos: null,

    // frequent updates
    turnCount: -1,
    visibleRobotMap: null,
    fuzzyCost: [],
};
