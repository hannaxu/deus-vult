import vars from './variables';

import { coord8Encrypt, coord8Decrypt, coord8Encrypt2, coord8Decrypt2 } from './conversion';
import { assertAll } from './conversion';

var trusted = {};


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
 * Communicate castle locations in the first two turns.
 */
export function castleLocsComm(){
  if(this.me.turn == 1){
    //assertAll.call(this);
    
    vars.castleLocs = {};
    vars.castleLocs[this.me.id] = [vars.xpos, vars.ypos];
    vars.castleUncert = {};

    // read incoming signals
    for(var i = 0; i < vars.commRobots.length; i++){
      var other_r = vars.commRobots[i];
      if(other_r.id == this.me.id)
        continue;
      if(other_r.turn == 0)
        continue;

      // these will always be castles
      var uncertLoc = coord8Decrypt(other_r.castle_talk, vars.xmax);
      vars.castleUncert[other_r.id] = uncertLoc[0];
      vars.castleLocs[other_r.id] = [Math.floor((uncertLoc[0][0]+uncertLoc[1][0])/2),
                                     Math.floor((uncertLoc[0][1]+uncertLoc[1][1])/2)];
    }
    this.castleTalk(coord8Encrypt(vars.xpos, vars.ypos, vars.xmax));
  }

  else if(this.me.turn == 2){
    // read incoming signals
    for(var i = 0; i < vars.commRobots.length; i++){
      var other_r = vars.commRobots[i];
      if(other_r.id == this.me.id)
        continue;
      if(other_r.turn == 1){
        // best attempt at distinguishing built from castle
        // NOTE: this will break if a built unit sends a castleTalk within the first two turns
        if(other_r.castle_talk == 0)
          continue;

        var uncertLoc = coord8Decrypt(other_r.castle_talk, vars.xmax);
        vars.castleUncert[other_r.id] = uncertLoc[0];
        vars.castleLocs[other_r.id] = [Math.floor((uncertLoc[0][0]+uncertLoc[1][0])/2),
                                       Math.floor((uncertLoc[0][1]+uncertLoc[1][1])/2)];
      }
      else if(other_r.turn == 2){
        // these will always be castles
        var exactLoc = coord8Decrypt2((2**4-1) & other_r.castle_talk, vars.xmax, vars.castleUncert[other_r.id]);
        delete vars.castleUncert[other_r.id];
        vars.castleLocs[other_r.id] = exactLoc;
      }
    }
    this.castleTalk((2**4) | coord8Encrypt2(vars.xpos, vars.ypos, vars.xmax));
  }

  else if(this.me.turn == 3){
    // read incoming signals
    for(var i = 0; i < vars.commRobots.length; i++){
      var other_r = vars.commRobots[i];
      if(other_r.id == this.me.id)
        continue;
      if(other_r.turn == 2){
        // best attempt at distinguishing built from castle
        // NOTE: this will break if a built unit sends a castleTalk within the first two turns 
        if(other_r.castle_talk == 0)
          continue;
        if(!(other_r.id in vars.castleUncert))
          vars.castleUncert[other_r.id] = [0, 0];

        var exactLoc = coord8Decrypt2((2**4-1) & other_r.castle_talk, vars.xmax, vars.castleUncert[other_r.id]);
        delete vars.castleUncert[other_r.id];
        vars.castleLocs[other_r.id] = exactLoc;
      }
    }
  }

  if(typeof(vars.castleUncert) != 'undefined'){
    if(this.me.turn > 1 && Object.keys(vars.castleUncert).length == 0){
      delete vars.castleUncert;
      // exact castle locations first found
      //this.log(vars.castleLocs);
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

