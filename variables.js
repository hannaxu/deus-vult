export default {
  // CONSTANTS
  POS_INF: 2147483647,
  NEG_INF: -2147483648,

  MIN_ATK_ROBOTS: 30, // minimum number of visible ally attackers before deusVulting
  MIN_ATK_FUEL: 7500, // minimum amount of fuel before deusVulting
  ATTACK_DEPTH: 50, // maximum search depth of navigate when finding path to deusVult

  MIN_LAT_DIST: 2, // must be strictly greater than this
  DEFENSE_DEPTH: 10, // maximum search depth of navigate() when forming the defensive lattice
  NAVIGATION_TIME_LIMIT: 100, // maximum amount of time used in navigate()

  ENEMY_PRIORITY: [5, 4, 3, 0, 1, 2],

  CASTLE_MIN_DEF: 8, // minimum number of visible ally attackers on defense per castle

  CHURCH_DEPTH: 20, // how many moves a pilgrim is willing to make to build a church
  CHURCH_MIN_DEF: 4,
  CHURCH_MAX_DEF: 12,

  SPECS: null,

  creatorID: 0,
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
  allAttackable: [],
  visible: [],
  connections: {},
  firstTurnPoss: {},

  // UPDATED EVERY TURN

  buildRobot: null,
  me: null,
  xpos: null,
  ypos: null,
  teamFuel: null,
  teamKarb: null,

  // Managers
  CastleTalk: null,
  
  // tiles
  dangerTiles: null,

  // Robots visible to me
  visibleRobotMap: null,
  commRobots: null,         // all visible and radioable (for castles, all team robots, including yourself)
  visibleRobots: null,      // only in visible range (not including yourself)
  visibleEnemyRobots: null, // only in visible range and is an enemy
  radioRobots: null,        // sent a radio signal (not including yourself)
  castleTalkRobots: null,   // sent a castle_talk (not including yourself)

  // Created information
  symmetry: [null, null],
  castleVars: [[],[],[],[]],

  castleLocs: {}, // (castles only, for now) {id: [x, y]} of all friendly castles
  baseLocs: {}, // stores Castle and Church locations
  baseChange: true, //set to true when the base list is updated (set to false by some pilgrim methods)
  fuzzyCost: []
};
