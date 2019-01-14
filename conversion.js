/**
 * Converts an (x, y) coordinate to an 8-bit message.
 * @param   {int} x   The x-coordinate.
 * @param   {int} y   The y-coordinate.
 * @param   {int} max The map size.
 * @returns {int}     The resultant 8-bit message. Can be read with coord8Decrypt().
 */
export function coord8Encrypt(x, y, max){
    var step = max / (2**4);
  
    var xCell = Math.floor(x / step);
    var yCell = Math.floor(y / step);
    return xCell << 4 | yCell;
  }
  /**
   * Converts a coord8Encrypt message back to coordinates.
   * @param   {int} message The received 8-bit message.
   * @param   {int} max     The map size.
   * @returns {int[][]}     Coordinate plus uncertainty. First element is top left coord, second it bottom right.
   */
  export function coord8Decrypt(message, max){
    var step = max / (2**4);
  
    var xCell = message >> 4;
    var yCell = message & (2**4-1);
    return [[Math.ceil(xCell*step), Math.ceil(yCell*step)],
            [Math.ceil((xCell+1)*step-1), Math.ceil((yCell+1)*step-1)]];
  }
  /**
   * 2nd-turn clarification of coordinate previously encoded with coord8Encrypt().
   * @param   {int} x   The x-coordinate.
   * @param   {int} y   The y-coordinate.
   * @param   {int} max The map size.
   * @returns {int}     The resultant 4-bit message. Can be read with coord8Decrypt2().
   */
  export function coord8Encrypt2(x, y, max){
    var step = max / (2**4);
  
    var xCell = Math.floor(x / step);
    var yCell = Math.floor(y / step);
    
    var xDiff = x - Math.ceil(xCell*step);
    var yDiff = y - Math.ceil(yCell*step);
    return xDiff << 2 | yDiff;
  }
  /**
   * Clarify the uncertainty of a previously received coord8Encrypt() message through a received coord8Encrypt2() message.
   * @param   {int}   message   The received 4-bit message.
   * @param   {int}   max       The map size.
   * @param   {int[]} top_left  The 0-th element of previous coord8Decrypt() result.
   * @returns {int[]}           Absolute coordinate.
   */
  export function coord8Decrypt2(message, max, top_left){
    var xDiff = message >> 2;
    var yDiff = message & (2**2-1);
    return [top_left[0]+xDiff, top_left[1]+yDiff];
  }
  
  
  
  // DEBUGGING
  
  export function assertAll(){
    assertCoord8.call(this);
  }
  export function assertCoord8(){
    for(var max = 32; max <= 60; max++){
      for(var x = 0; x < max; x++){
        var result = coord8Decrypt2(coord8Encrypt2(x, x, max), max, coord8Decrypt(coord8Encrypt(x, x, max), max)[0]);
        if(result[0] != x || result[1] != x){
          this.log("[FAILED] Coordinate 8-bit encryption - x:" + x + " max:" + max);
          return false;
        }
      }
    }
    this.log("[PASSED] Coordinate 8-bit encryption");
    return true;
  }