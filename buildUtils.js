import vars from './variables';

export function optBuild(cx, cy) {
    //resource consideration
    var deposits = [0,[],[]];
    var buildOptPil = [];
    var di = 1;
    var dj = 0;
    var seg = 1;
    var i = cx;
    var j = cy;
    var segPass = 0;
    for (var k = 0; k < 100; ++k) {
      if( !(i < 0 || j < 0 || i >= vars.xmax || j >= vars.ymax) ) {
        if (vars.karbMap[j][i]) {
          deposits[0] += 1;
          deposits[1].push([j,i]);
        }
        if (vars.fuelMap[j][i]) {
          deposits[0] += 1;
          deposits[2].push([j,i]);
        }
      }
      i += di;
      j += dj;
      ++segPass;
      if (segPass == seg) {
        segPass = 0;
        var temp = di;
        di = -dj;
        dj = temp;
        if (dj == 0)
            ++seg;
      }
    }

    for(var i = 0; i < deposits[1].length; i++) {
      buildOptPil.push(transferPt(deposits[1][i], cx, cy));
    }
    for(var i = 0; i < deposits[2].length; i++) {
      buildOptPil.push(transferPt(deposits[2][i], cx, cy));
    }
    buildOptPil = buildOptPil.concat(vars.buildable);
    return [deposits, buildOptPil];
}

function transferPt(coor, mx, my) {
    var y = coor[0]-my;
    if( y != 0 ) y = y/Math.abs(y);
    var x = coor[1]-mx;
    if( x != 0 ) x = x/Math.abs(x);
    return [y, x];
}