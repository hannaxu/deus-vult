export default {
  // CONSTANTS
  
  POS_INF: 2147483647,
  NEG_INF: -2147483648,
  SPECS: null,
  firstTurn: true,
  creatorPos: null,
  
  // Map information
  passableMap: null,
  karbMap: null,
  fuelMap: null,
  xmax: null,
  ymax: null,
  rLocs: [], // list of {type, x, y}; type: 0=fuel, 1=karb
  
  // This unit's specs
  moveRadius: null,
  attackRadius: null, // [min, max]
  buildRadius: null,
  sightRadius: null,
  attackCost: null,
  moveCost: null,
  maxKarb: null,
  maxFuel: null,

  // List of viable [x, y] locations for this unit
  moveable: [],
  buildable: [],



  // UPDATED EVERY TURN

  xpos: null,
  ypos: null,
  teamFuel: null,
  teamKarb: null,
  
  // Robots visible to me
  visibleRobotMap: null,
  commRobots: null,       // all visible and radioable (for castles, all team robots, including yourself)
  visibleRobots: null,    // only in visible range (not including yourself)
  radioRobots: null,      // sent a radio signal (not including yourself)
  castleTalkRobots: null, // sent a castle_talk (not including yourself)
  
  // Created information
  baseLocs: {}, // stores Castle and Church locations
  fuzzyCost: []
};
