export default {
  // constants
  POS_INF: 2147483647,
  NEG_INF: -2147483648,

  // initialize once
  SPECS: null,
  visible: [],
  attackable: [],
  moveable: [],
  buildable: [],
  firstTurn: true,
  passableMap: null,
  karbMap: null,
  fuelMap: null,
  xmax: null,
  ymax: null,
  moveRadius: null,
  visionRadius: null,
  buildRadius: null,
  attackRadius: null, // 2d array with lower and upper bound
  attackCost: null,
  moveCost: null,
  maxKarb: null,
  maxFuel: null,
  unitType: null,
  creatorPos: null,
  rLocs: [], //.type 0 for fuel .x .y

  // frequent updates
  turnCount: -1,
  visibleRobotMap: null,
  visibleRobots: null, // stores robot objects only in visible range
  visibleEnemyRobots: null,
  commRobots: null, //stores all robots possible to receive signals from
  baseLocs: {}, // stores Castle and Church locations
  fuzzyCost: [],
    teamFuel: null,
};
