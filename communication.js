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

export function readMessageTrusted(other_r){
  // Chceck if the message has the trusted signature
  var message = cypherMessage(other_r.signal, this.me.team);
  var id_true = other_r.id & 255;
  var id_restored = message >> 8;
  var message_restored = message & 255;
  return [id_restored == id_true, message_restored];
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

    var res = readMessageTrusted.call(this, other_r);
    var message_restored = res[1];

    // Trusted signature detected
    if(res[0]){
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
 * @param {int[]}     prims           [totalCastles, castleOrder].
 * @param {function}  addFunction     Function to call when adding a castle.
 */
export function castleLocComm(myCastles, castleOrderAll, unitTrackingDefenders, prims, addFunction) {
  if(this.me.turn == 1) {
    prims[0] = vars.commRobots.length;
    //this.log("There are " + prims[0] + " total castles");

    for(var i = 0; i < vars.commRobots.length; i++) {
      var other_r = vars.commRobots[i];
      if(other_r.turn == this.me.turn) {
          if(other_r.id != this.me.id ) {
          prims[1]++;
          // read other information
          readInfo.call(this, myCastles, castleOrderAll, unitTrackingDefenders, other_r, addFunction);
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
    unitTrackingDefenders[this.me.id] = 0;
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
        readInfo.call(this, myCastles, castleOrderAll, unitTrackingDefenders, other_r, addFunction);
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
 * @returns {[Object, int, Robot]}      Updated unitTracking; number of churching pilgrims; prev built robot.
 */
export function trackUnits(unitTrackingChurches, unitTrackingDefenders, totalCastles, deleteFunction){
  if(this.me.turn == 1)
    return null;
  
  var churching = 0;

  for(var i in vars.castleTalkRobots){
    var other_r = vars.castleTalkRobots[i];

    if(this.me.turn == 2 && totalCastles > 1 && (other_r.turn < 2 || other_r.id == this.me.id))
      continue;

    try{
      switch(other_r.castle_talk){
        case 1:
          //killed castle
          this.log("Received castle Kill");
          deleteFunction.call(this, other_r.id);
          break;
        case 2:
          //built defender
          if(!(other_r.id in unitTrackingDefenders))
            this.log("ERROR: Unit " + other_r.id + " is not a castle");
          else{
            //this.log("Received defender build");
            unitTrackingDefenders[other_r.id]++;
          }
          break;
        case 3:
          //built church
          this.log("Received Church build");
          unitTrackingChurches++;
          break;
        case 4:
          //gone churching
          //this.log("Received churching");
          churching++;
      }
    }
    catch(err){
      this.log("UTRACK: Failed when tracking " + other_r.id + " at (" + other_r.x + ", " + other_r.y + ")");
      this.log(err.toString());
    }
  }
  return [unitTrackingChurches, churching];
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

function readInfo(myCastles, castleOrderAll, unitTrackingDefenders, other_r, addFunction){
  var order = other_r.castle_talk >> 6;
  var x = other_r.castle_talk & 63;
  var y = Math.abs(this.last_offer[this.me.team][order&1]) & (2**6-1);
  myCastles[other_r.id] = [x, y];
  castleOrderAll[order] = other_r.id;
  addFunction.call(this, myCastles[other_r.id]);
  unitTrackingDefenders[other_r.id] = 0;
}