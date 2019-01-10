/**
 * Radio a message ot friendly units, encrypt and add signature.
 * Message format:
 * 8 bits - last 8 bits of unit id,
 * 8 bits - message.
 * @param {int} message
 * @param {int} sq_radius 
 */
export function sendMessage(message, sq_radius) {
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
 * Filter enemy messages according to our team signature + encryption.
 */
export function readMessages() {
  var robots = this.getVisibleRobots();
  for(var i = 0; i < robots.length; i++){
    var other_r = robots[i];
    if(other_r.id == this.id)
      return;
    if(!this.isRadioing(other_r))
      return;
    var message_decr = cypherMessage(other_r.signal);

    // Filter enemy messages
    var id_true = other_r.id & 255;
    var id_restored = message_decr >> 8;
    var message = message_decr & 255;
    
    // Friendly messages
    if(id_restored == id_true){
      try{
        processMessage.call(this, message, other_r);
      }
      catch(e){
        this.log("Potentially malicious message from unit " + other_r.id);
      }
    }

    // Enemy messages
    else{
      // maybe do something here idk
    }
  }
}


// Helper functions

/**
 * Encodes/decodes a single message according to our team cypher.
 * @param   {int} message 16-bit message to encode/decode.
 * @return  {int}         Encoded/decoded 16-bit message.
 */
function cypherMessage(message) {
    const secret = 60211;
    return message ^ secret;
}

function processMessage(message, sender) {
  // PROCEED WITH CAUTION - these messages might still be compromised
  // There is a 0.39% chance a random enemy message will end up here
  
  // TODO: process decoded messages
  this.log("Received message " + message.toString(2) + " from unit " + sender.id);
}