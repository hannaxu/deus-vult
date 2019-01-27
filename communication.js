import vars from './variables';
import * as utils from './utils';

import { coord8Encrypt, coord8Decrypt, coord8Encrypt2, coord8Decrypt2 } from './conversion';

var trusted = {};
var temp = new Set();


// MESSAGING FUNCTIONS

/**
 * Radio a typical message.
 * The message will still be encoded for additional secutiry.
 * @param {int} message
 * @param {int} sq_radius
 */
export function sendMessage(message, sq_radius) {
  if(!checkParams.call(this, message, sq_radius, true))
    return;

  this.signal(cypherMessage(message, this.me.team), sq_radius);
  //this.log("Successfully sent message " + message.toString(2) + " over sq_radius " + sq_radius);
}
/**
 * Radio a shorter message with a recognizable signature.
 * Units will accept it without needing to see you.
 *
 * Message format:
 * 8 bits - last 8 bits of unit id,
 * 8 bits - message.
 * @param {int} message
 * @param {int} sq_radius
 */
export function sendMessageTrusted(message, sq_radius) {
  if(!checkParams.call(this, message, sq_radius, false))
    return;

  var message_full = (this.me.id & 255) << 8 | message;
  this.signal(cypherMessage(message_full, this.me.team), sq_radius);
  //this.log("Successfully sent message " + message.toString(2) + " over sq_radius " + sq_radius);
}

/**
 * Read the full incoming queue of messages.
 * Messages that weren't sent through methods in this file will not make sense.
 *
 * Automatically receive messages from visible robots.
 * Otherwise, only receive if the mesage is trusted, or the robot is trusted.
 */
export function readMessages() {

  for(var i = 0; i < vars.visibleRobots.length; i++){
    var other_r = vars.visibleRobots[i];

    if(other_r.team == this.me.team)
      trusted[other_r.id] = 999;
    else
      trusted[other_r.id] = -999;
  }

  for(var i = 0; i < vars.radioRobots.length; i++){
    var other_r = vars.radioRobots[i];

    if(typeof(trusted[other_r.id]) == 'undefined')
      trusted[other_r.id] = 0;

    // Chceck if the message has the trusted signature
    var message = cypherMessage(other_r.signal, this.me.team);
    var id_true = other_r.id & 255;
    var id_restored = message >> 8;
    var message_restored = message & 255;

    // Trusted signature detected
    if(id_restored == id_true){
      try{
        processMessage.call(this, message_restored, other_r, false);
        trusted[other_r.id] += 1;
      }
      catch(e){
        this.log("Potentially malicious message from unit " + other_r.id);
        trusted[other_r.id] -= 10;
      }
    }

    // Visible messages
    else if(typeof(other_r.team) != 'undefined'){
      if(other_r.team == this.me.team){
        processMessage.call(this, message, other_r, true);
      }
      else{
        // maybe do something here idk
      }
    }

    // Unsure - checking trust factor
    else{
      if(trusted[other_r.id] > 1){
        processMessage.call(this, message, other_r, true);
      }
      else{
        // maybe do something here idk
      }
    }
  }
}

/**
 * Encodes/decodes a single message according to our team cypher.
 * @param   {int}   message 16-bit message to encode/decode.
 * @param   {int}   team    Our team code (red/blue)
 * @return  {bool}          Encoded/decoded 16-bit message.
 */
export function cypherMessage(message, team) {
  const secret = [53734, 60211];
  return message ^ secret[team];
}



// CASTLE FUNCTIONS

/**
 * Communicate castle locations.
 * Use proposeTrade (for now) to avoid castleTalk collisions.
 * Send only during first turn.
 * Receive during first and second turns.
 * @param {Object}    myCastles       {id: [x, y]} to store the castles to.
 * @param {int[]}     castleOrderAll  List of castle ids in turn order.
 * @param {Object}    unitTracking    {id: Robot} of all tracked robots.
 * @param {int[]}     prims           [totalCastles, castleOrder].
 * @param {function}  addFunction     Function to call when adding a castle.
 */
export function castleLocComm(myCastles, castleOrderAll, unitTracking, prims, addFunction) {
  if(this.me.turn == 1) {
    prims[0] = vars.commRobots.length;
    //this.log("There are " + prims[0] + " total castles");

    for(var i = 0; i < vars.commRobots.length; i++) {
      var other_r = vars.commRobots[i];
      if(other_r.turn == this.me.turn) {
          if(other_r.id != this.me.id ) {
          prims[1]++;
          // read other information
          readInfo.call(this, myCastles, castleOrderAll, unitTracking, other_r, addFunction);
        }
      }
      else{
        // to later tell which ones are castles
        temp.add(parseInt(other_r.id));
      }
    }
    myCastles[this.me.id] = [this.me.x, this.me.y];
    castleOrderAll[prims[1]] = this.me.id;
    addFunction.call(this, myCastles[this.me.id]);
    startTracking(unitTracking, this.me, this.me.x, this.me.y, this.me.unit, this.me.team);
    //this.log("I am castle " + prims[1]);
    if(prims[0] - prims[1] == 1){
      this.log(myCastles);
      this.log(castleOrderAll);
    }

    if(prims[0] > 1){
      // send my information
      this.castleTalk(prims[1] << 6 | this.me.x);
      var k = Math.abs(this.last_offer[this.me.team][0]);
      var f = Math.abs(this.last_offer[this.me.team][1]);
      if(prims[1] == 1)
        f = 2**4-1<<6 | this.me.y;
      else
        k = 2**4-1<<6 | this.me.y;
      if(this.me.team == vars.SPECS.RED)
        return this.proposeTrade(-k, -f);
      else
        return this.proposeTrade(k, f);
    }
  }

  else if(this.me.turn == 2){
    for(var i = 0; i < vars.commRobots.length; i++) {
      var other_r = vars.commRobots[i];
      if(temp.has(other_r.id)) {
        // read other information
        readInfo.call(this, myCastles, castleOrderAll, unitTracking, other_r, addFunction);
      }
    }
    if(prims[0] - prims[1] > 1){
      this.log(myCastles);
      this.log(castleOrderAll);
    }
  }
}

/**
 * Modifies the unitTracking structure based on received signals.
 * Additionally tracks: unit, team, x, y, fuel, farbonite.
 * @param   {Object}    unitTracking    {id: Robot} of all tracked units.
 * @param   {int[]}     untracked       Ids of all untracked robots.
 * @param   {int}       totalCastles    The number of total friendly castles.
 * @param   {function}  deleteFunction  Function to call to delete a castle.
* @returns {[Object, int]}              Updated unitTracking; number of churching pilgrims.
 */
export function trackUnits(unitTracking, untracked, totalCastles, deleteFunction){
  if(this.me.turn == 1)
    return;
  
  var unitTrackingNew = {}
  var appeared = [];
  var built = [];
  var churching = 0;

  for(var i in vars.commRobots){
    var other_r = vars.commRobots[i];
    
    if(other_r.id in unitTracking){
      // unit currently tracked
      var tracked_r = unitTracking[other_r.id];
      unitTrackingNew[other_r.id] = tracked_r;

      tracked_r.turn = other_r.turn;
      tracked_r.signal = other_r.signal;
      tracked_r.signal_radius = other_r.signal_radius;
      tracked_r.castle_talk = other_r.castle_talk;

      // prevent castleLoc messages from messing with unit tracking
      if(this.me.turn == 2 && totalCastles > 1 && (other_r.turn < 2 || other_r.id == this.me.id))
        continue;

      // receive updates
      try{
        var actions = vars.CastleTalk.receive(other_r.castle_talk, tracked_r.unit);
        for(var name in actions){
          switch(name){
            case "move":
              if(utils.checkBounds(tracked_r.x + actions[name].dxdy[0],
                tracked_r.y + actions[name].dxdy[1])){
                tracked_r.x += actions[name].dxdy[0];
                tracked_r.y += actions[name].dxdy[1];
              }
              else
                this.log("UTRACK: Attempted to move " + other_r.id + " off of the map.");
              break;
            case "build":
              var info = [actions[name].unit,
                tracked_r.x + actions[name].dxdy[0],
                tracked_r.y + actions[name].dxdy[1]
              ];
              if(tracked_r.unit == vars.SPECS.PILGRIM)
                info[0] = vars.SPECS.CHURCH;
              if(utils.checkBounds(info[1], info[2]))
                built.push(info);
              else
                this.log("UTRACK: Attempted to build by " + other_r.id + " outside the map.");
              break;
            case "mine":
              if(vars.karbMap[tracked_r.y][tracked_r.x])
                tracked_r.karbonite += 2;
              else if(vars.fuelMap[tracked_r.y][tracked_r.x])
                tracked_r.fuel += 10;
              else
                this.log("UTRACK: Location " + tracked_r.x + ", " + tracked_r.y + " is not mineable.");
              break;
            case "give":
              var loc = [tracked_r.x+actions[name].dxdy[0], tracked_r.y+actions[name].dxdy[1]];
              var recepient = null;
              //TODO: fix mmoving + giving
              for(var id in unitTracking){
                if(unitTracking[id].x == loc[0] && unitTracking[id].y == loc[1]){
                  recepient = unitTracking[id];
                  break;
                }
              }
              if(recepient == null)
                this.log("UTRACK: Recepient at (" + loc[0] + ", " + loc[1] + ") not found.");
              else{
                var karb = tracked_r.karbonite;
                var fuel = tracked_r.fuel;
                var karb_cap = vars.SPECS.UNITS[recepient.unit].KARBONITE_CAPACITY;
                var fuel_cap = vars.SPECS.UNITS[recepient.unit].FUEL_CAPACITY;
                
                if(karb_cap != null){
                  karb = Math.min(karb_cap - recepient.karbonite, karb);
                  recepient.karbonite += karb;
                }
                tracked_r.karbonite -= karb;
                
                if(fuel_cap != null){
                  fuel = Math.min(fuel_cap - recepient.fuel, fuel);
                  recepient.fuel += fuel;
                }
                tracked_r.fuel -= fuel;
              }
              break;
            case "opt":
              if(actions[name] > 0){
                if(tracked_r.unit == 2)
                  churching++;
                else if(tracked_r.unit > 2)
                  deleteFunction.call(this, other_r.id);
              }
          }
        }
      }
      catch(err){
        this.log("UTRACK: Failed when tracking " + other_r.id + " at (" + other_r.x + ", " + other_r.y + ")");
        if(true){
          var lines = err.stack.split('\n');
          for(var i in lines){
            this.log(lines[i]);
          }
        }
        else
          this.log(err.toString());
      }
    }

    else if(other_r.team == this.me.team){
      if(!untracked.has(other_r.id)){
        appeared.push(other_r);
      }
    }
  }


  // add any visible
  var toRemove = new Set();
  for(var i in appeared){
    var other_r = appeared[i];
    if(this.isVisible(other_r)){
      var dxdy = [0, 0];
      if(other_r.turn > 0){
        var actions = vars.CastleTalk.receive(other_r.castle_talk, other_r.unit);
        if('move' in actions)
          dxdy = actions.move.dxdy;
      }
      var idx = built.findIndex(function(loc){
        return loc[1] == (other_r.x-dxdy[0]) &&
          loc[2] == (other_r.y-dxdy[1]);
      });
      if(idx == -1)
        this.log("UTRACK: No matching build job found for visible unit " + other_r.id);
      else{
        // found build job
        //this.log("UTRACK: Tracking unit " + other_r.id + " at (" + other_r.x + ", " + other_r.y + ")");
        startTracking(unitTrackingNew, other_r, other_r.x, other_r.y, other_r.unit, other_r.team);
      }
      built.splice(idx, 1);
      toRemove.add(parseInt(i));
    }
  }
  appeared = appeared.filter(function(_, i){
    return !toRemove.has(i);
  })
  // match built units with appeared
  switch(built.length){
    case 0:
      break;
    case 1:
      if(appeared.length == 0)
        this.log("UTRACK: No matching unit found for build at " + built[0][1] + ", " + built[0][2]);
      else{
        if(appeared[0].turn > 0){
          var actions = vars.CastleTalk.receive(appeared[0].castle_talk, built[0][0]);
          if('move' in actions){
            built[0][1] += actions.move.dxdy[0];
            built[0][2] += actions.move.dxdy[1];
          }
        }
        //this.log("UTRACK: Tracking unit " + appeared[0].id + " at (" + built[0][1] + ", " + built[0][2] + ")");
        startTracking(unitTrackingNew, appeared[0], built[0][1], built[0][2], built[0][0], this.me.team);
      }
      break;
    default:
      this.log("UTRACK: Ambiguous builds detected. Units not matched.");
      for(var i in appeared){
        var other_r = appeared[i];
        untracked.add(parseInt(other_r.id));
      }
  }
  return [unitTrackingNew, churching];
}



// HELPER FUNCTIONS

/**
 * Process the received message and act accordingly.
 * @param {int}   message The received message.
 * @param {bool}  sender  The robot that sent the message.
 * @param {Robot} isLong  Whether the message is 8-bit or 16-bit.
 */
function processMessage(message, sender, isLong) {
  // PROCEED WITH CAUTION - these messages might still be compromised
  // There is a 0.39% chance a random enemy message will end up here

  // TODO: process decoded messages
  //this.log("Received message " + message.toString(2) + " from unit " + sender.id);
}

function checkParams(message, sq_radius, isLong){
  // Several checks to avoid errors - may remove later
  if(sq_radius > this.fuel){
    this.log("Not enough fuel to send message with sq_radius " + sq_radius);
    return false;
  }
  if(message > 65535 || (!isLong && message > 255)){
    this.log("Message " + message.toString(2) + " too large to send");
    return false;
  }
  return true;
}

function readInfo(myCastles, castleOrderAll, unitTracking, other_r, addFunction){
  var order = other_r.castle_talk >> 6;
  var x = other_r.castle_talk & 63;
  var y = Math.abs(this.last_offer[this.me.team][order&1]) & (2**6-1);
  myCastles[other_r.id] = [x, y];
  castleOrderAll[order] = other_r.id;
  addFunction.call(this, myCastles[other_r.id]);
  startTracking(unitTracking, other_r, x, y, vars.SPECS.CASTLE, this.me.team);
}

function startTracking(unitTracking, other_r, x, y, unit, team){
  unitTracking[other_r.id] = {type:"robot", id:other_r.id, turn:other_r.turn,
    team:team, unit:unit, x:x, y:y, fuel:0, karbonite:0,
    signal:other_r.signal, signal_radius:other_r.signal_radius, castle_talk:other_r.castle_talk};
}