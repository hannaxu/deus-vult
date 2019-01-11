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
  // Several checks to avoid errors - may remove later
  if(sq_radius > this.fuel){
    this.log("Not enough fuel to send message with sq_radius " + sq_radius);
    return;
  }
  if(message > 255){
    this.log("Message " + message.toString(2) + " too large to send");
    return;
  }

  var message_full = (this.id & 255) << 8 | message;
  this.signal(cypherMessage(message_full), sq_radius);
  this.log("Successfully sent message " + message.toString(2) + " over sq_radius " + sq_radius);
}

/**
 * Read the full incoming queue of messages.
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
    var message_decr = cypherMessage(other_r.signal);
    var id_true = other_r.id & 255;
    var id_restored = message_decr >> 8;
    var message_restored = message_decr & 255;

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
        processMessage.call(this, other_r.signal, other_r, true);
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


// Helper functions

/**
 * Encodes/decodes a single message according to our team cypher.
 * @param   {int}   message 16-bit message to encode/decode.
 * @return  {bool}          Encoded/decoded 16-bit message.
 */
function cypherMessage(message) {
    const secret = 60211;
    return message ^ secret;
}

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
