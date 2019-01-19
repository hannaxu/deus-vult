import {coord8Encrypt, coord8Decrypt, coord8Encrypt2, coord8Decrypt2} from './conversion';

export function testCoord8(){
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