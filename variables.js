export default {
  // CONSTANTS
  CAMPDIST: 5,
  POS_INF: 2147483647,
  NEG_INF: -2147483648,
  MIN_ATK_ROBOTS: 30,
  MIN_ATK_FUEL: 5000,
  MIN_LAT_DIST: 2, // must be strictly greater than this
  DEFENSE_DEPTH: 15,
  SPECS: null,
  creatorPos: null,
  myPos: null,

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
  visionRadius: null,
  attackCost: null,
  moveCost: null,
  maxKarb: null,
  maxFuel: null,
  unitType: null,

  // List of viable [x, y] locations for this unit
  moveable: [],
  buildable: [],
  attackable: [],
  visible: [],
  connections: {},
  firstTurnPoss: {},

  // UPDATED EVERY TURN

  buildRobot: null,
  xpos: null,
  ypos: null,
  teamFuel: null,
  teamKarb: null,

  // Robots visible to me
  visibleRobotMap: null,
  commRobots: null,         // all visible and radioable (for castles, all team robots, including yourself)
  visibleRobots: null,      // only in visible range (not including yourself)
  visibleEnemyRobots: null, // only in visible range and is an enemy
  radioRobots: null,        // sent a radio signal (not including yourself)
  castleTalkRobots: null,   // sent a castle_talk (not including yourself)

  // Created information
  castleLocs: {}, // (castles only, for now) {id: [x, y]} of all friendly castles
  baseLocs: {}, // stores Castle and Church locations
  fuzzyCost: []
};
