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
  this.log("Successfully sent message " + message.toString(2) + " over sq_radius " + sq_radius);
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

  var message_full = (this.id & 255) << 8 | message;
  this.signal(cypherMessage(message_full, this.me.team), sq_radius);
  this.log("Successfully sent message " + message.toString(2) + " over sq_radius " + sq_radius);
}

/**
 * Read the full incoming queue of messages.
 * Messages that weren't sent through methods in this file will not make sense.
 * 
 * Automatically receive messages from visible robots.
 * Otherwise, only receive if the mesage is trusted, or the robot is trusted.
 */
export function readMessages() {
  var robots = this.getVisibleRobots();
  for(var i = 0; i < robots.length; i++){
    var other_r = robots[i];
    if(other_r.id == this.id)
      continue;
    if(!this.isRadioing(other_r))
      continue;
    
    // Chceck if the message has the trusted signature
    var message = cypherMessage(other_r.signal, this.me.team);
    var id_true = other_r.id & 255;
    var id_restored = message >> 8;
    var message_restored = message & 255;

    // Trusted friendly messages
    if(id_restored == id_true){
      try{
        processMessage.call(this, message_restored, other_r, false);
      }
      catch(e){
        this.log("Potentially malicious message from unit " + other_r.id);
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

    // Enemy messages or untrusted
    else{
      // maybe do something here idk
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


// Helper functions

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
  this.log("Received message " + message.toString(2) + " from unit " + sender.id);
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