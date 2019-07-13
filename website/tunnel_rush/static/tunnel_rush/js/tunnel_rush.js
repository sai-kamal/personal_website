(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var shaders = require('./shaders');

var _require = require('./models'),
    drawModel = _require.drawModel,
    makeModel = _require.makeModel;

var m = require('./matrix');
var vec = require('./vector');

window.playFlag = 0;
window.grayScale = 0;
window.nightVision = 0;
window.gFlag = 1;
window.nFlag = 1;
window.velocity = 1;
window.level = 1;
window.score = 0;
window.prevScore = -10;

var numObstacles = 7;
var numObstacles2 = 5;
// var now = 0;
var then = 0;
var scalex = 1;
var scaley = 1;
var scalez = 1;

var up = [0, 1, 0];
var outerRadius = 50.0 * scalex;
var revolveRadius = outerRadius;
window.revolveAngle = 0;
window.revolveSpeed = 25;

window.octRadius = 5 * scalex;
window.octAngle = 270;
window.octSpeed = 250;
window.octStepsA = 0;
window.octStepsD = 0;
window.Matrices = {};
window.models = {};
window.keyMap = {};

var Camera = {
  x: revolveRadius,
  y: 0,
  z: 0,
  lookx: 0,
  looky: 0,
  lookz: 0,
  tempx: 0,
  tempz: 0
};

window.Initialize = Initialize;
window.Camera = Camera;

function Initialize() {
  // document.getElementById('backaudio').play();
  window.canvas = document.getElementById("canvas");
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  window.gl = canvas.getContext("experimental-webgl");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // setup a GLSL program
  shaders.createShader('material');

  // PIPE MODEL
  // '/' in front of static means url in js; without it, it is taken as file path.
  makeModel('pipe', '/static/tunnel_rush/objects/pipe', [0, 0, 0], [scalex, scaley, scalez], [0, 0, 0]); //rotate dummy value = [0, 0, 0]
  // makeModel('pipe', 'assets/pipe', [0, 0, 0], [scalex, scaley, scalez], [0, 0, 0]) //rotate dummy value = [0, 0, 0]

  //OBSTACLES MODELS
  for (var i = 0; i < numObstacles; i++) {
    var randNum = (Math.random() + Math.random() + Math.random() + Math.random()) / 4;
    var temp = randNum * 1000 % 360 - 360;
    makeModel('obstacle' + i, '/static/tunnel_rush/objects/cubetex', [revolveRadius * Math.cos(toRadians(temp)), 0, revolveRadius * Math.sin(toRadians(temp))],
    // makeModel('obstacle' + i, 'assets/cubetex', [revolveRadius * Math.cos(toRadians(temp)), 0, revolveRadius * Math.sin(toRadians(temp))],
    [8, 1, 1], //scale
    temp, //rotateAngle1
    Math.random() * 1000 % 360, //rotateAngle2
    0);
  }
  //start the animation
  requestAnimationFrame(tick);
}

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

window.addEventListener('keydown', keyChecker);
window.addEventListener('keyup', keyChecker);

function keyChecker(key) {
  window.keyMap[key.keyCode] = key.type == "keydown";
}

function keyImplementation() {
  if (window.keyMap[37]) {
    window.octStepsA -= 1;
  } else if (window.keyMap[69]) {
    window.octStepsD -= 1;
  }
  //FOR forward and backward
  // else if (window.keyMap[87]) {
  //   window.revolveAngle -= 0.1;
  // }
  // else if (window.keyMap[83]) {
  //   window.revolveAngle += 0.1;
  // }
  else if (window.keyMap[71] && window.gFlag) {
      window.grayScale = !window.grayScale;
      window.gFlag = 0;
      gl.uniform1i(gl.getUniformLocation(program, 'grayScale'), window.grayScale);
    } else if (window.keyMap[78] && window.nFlag) {
      window.nightVision = !window.nightVision;
      window.nFlag = 0;
      gl.uniform1i(gl.getUniformLocation(program, 'nightVision'), window.nightVision);
    }
  if (!window.keyMap[71]) {
    window.gFlag = 1;
  }
  if (!window.keyMap[78]) {
    window.nFlag = 1;
  }
}

function autoMovement() {

  Camera.x = revolveRadius * Math.cos(toRadians(window.revolveAngle));
  Camera.z = revolveRadius * Math.sin(toRadians(window.revolveAngle));

  window.octAngle += Math.round(window.octStepsA - window.octStepsD) * window.deltaTime * window.octSpeed;
  var tempx = window.octRadius * Math.cos(toRadians(window.octAngle)) * Math.cos(toRadians(window.revolveAngle));
  Camera.y = window.octRadius * Math.sin(toRadians(window.octAngle));
  var tempz = window.octRadius * Math.cos(toRadians(window.octAngle)) * Math.sin(toRadians(window.revolveAngle));

  Camera.x += tempx;
  Camera.z += tempz;
  window.octStepsA = 0;
  window.octStepsD = 0;

  var look = vec.normalize(vec.cross(vec.normalize([Camera.x, Camera.y, Camera.z]), [0, 1, 0]));
  Camera.lookx = -look[0];
  Camera.looky = -look[1];
  Camera.lookz = -look[2];

  if (window.playFlag == 1) {
    window.revolveAngle -= window.revolveSpeed * window.deltaTime;
  }
  Camera.tempx = tempx;
  Camera.tempz = tempz;
  up[0] = Math.round(-tempx);
  up[1] = Math.round(-Camera.y);
  up[2] = Math.round(-tempz);
}

function resizeCanvas() {
  window.canvas.height = window.innerHeight;
  window.canvas.width = window.innerWidth;
}

function tick(now) {
  requestAnimationFrame(tick);
  if (!window.program) return;
  animate(now);
  keyImplementation();
  autoMovement();
  drawScene();
  detectCollisions();
}

function animate(now) {
  if (window.playFlag) {
    window.score++;
  }
  if (window.score == 300) {
    window.prevScore = window.score;
    window.level++;
    for (var i = 0; i < numObstacles; i++) {
      var rotationSpeed = Math.random() * (1.5 - 0.5 + 1) + 0.5;
      models["obstacle" + i].rotationSpeed = rotationSpeed;
    }
    for (i = 0; i < numObstacles2; i++) {
      var randNum = (Math.random() + Math.random() + Math.random() + Math.random()) / 4;
      var temp = randNum * 1000 % 360 - 360;
      rotationSpeed = Math.random() * (2.5 - 0.5 + 1) + 0.5;
      makeModel('obstacleBig' + i, '/static/tunnel_rush/objects/cubetex', [revolveRadius * Math.cos(toRadians(temp)), 0, revolveRadius * Math.sin(toRadians(temp))],
      // makeModel('obstacleBig' + i, 'assets/cubetex', [revolveRadius * Math.cos(toRadians(temp)), 0, revolveRadius * Math.sin(toRadians(temp))],
      // [8, 2, 1], //scale
      [8, 1, 1], //scale
      temp, //rotateAngle1
      Math.random() * 1000 % 360, //rotateAngle2
      rotationSpeed);
    }
  }
  if (window.score == 2 * window.prevScore && window.score > 150) {
    window.prevScore = window.score;
    window.level++;
    window.revolveSpeed *= 1.4;
    for (i = 0; i < numObstacles; i++) {
      models["obstacle" + i].rotationSpeed *= 1.2;
    }
    for (i = 0; i < numObstacles2; i++) {
      models["obstacleBig" + i].rotationSpeed *= 1.2;
    }
  }
  if (window.revolveSpeed > 50) window.revolveSpeed = 50;
  var score = document.getElementById('score');
  score.innerText = 'SCORE: ' + window.score + '\n\n' + 'LEVEL: ' + window.level;
  now *= 0.00085;
  window.deltaTime = now - then;
  updateCamera();
  then = now;
}

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  shaders.useShader('material');

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  for (var i = 0; i < numObstacles; i++) {
    Matrices.model = m.multiply(m.translate(models["obstacle" + i].center), m.multiply(m.rotateY(toRadians(-models["obstacle" + i].rotateAngle1)), m.multiply(m.rotateZ(toRadians(models["obstacle" + i].rotateAngle2 += models["obstacle" + i].rotationSpeed)), m.scale(models["obstacle" + i].scale))));
    drawModel(models["obstacle" + i]);
  }

  if (window.level >= 2) {
    for (i = 0; i < numObstacles2; i++) {
      Matrices.model = m.multiply(m.translate(models["obstacleBig" + i].center), m.multiply(m.rotateY(toRadians(-models["obstacleBig" + i].rotateAngle1)), m.multiply(m.rotateZ(toRadians(models["obstacleBig" + i].rotateAngle2 += models["obstacleBig" + i].rotationSpeed)), m.scale(models["obstacleBig" + i].scale))));
      drawModel(models["obstacleBig" + i]);
    }
  }

  Matrices.model = m.multiply(m.translate(models.pipe.center), m.scale(models.pipe.scale));
  drawModel(models.pipe);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);
}

function updateCamera() {
  var eye = [Camera.x, Camera.y, Camera.z];
  var target = [Camera.x + Camera.lookx, Camera.y + Camera.looky, Camera.z + Camera.lookz];
  Matrices.view = m.lookAt(eye, target, up);
  Matrices.projection = m.perspective(Math.PI / 2, canvas.width / canvas.height, 0.1, 500);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, Matrices.view);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, Matrices.projection);

  var lightPos = [revolveRadius * Math.cos(toRadians(window.revolveAngle - 25)), 0, revolveRadius * Math.sin(toRadians(window.revolveAngle - 25))];
  // var lightPos = target
  var lightPosLoc = gl.getUniformLocation(program, "light.position");
  var viewPosLoc = gl.getUniformLocation(program, "viewPos");
  gl.uniform3f(lightPosLoc, lightPos[0], lightPos[1], lightPos[2]);
  gl.uniform3f(viewPosLoc, target[0], target[1], target[2]);
  var lightColor = [];
  lightColor[0] = 1;
  lightColor[1] = 1;
  lightColor[2] = 1;
  var diffuseColor = vec.multiplyScalar(lightColor, 1); // Decrease the influence
  var ambientColor = vec.multiplyScalar(diffuseColor, 1); // Low influence
  gl.uniform3f(gl.getUniformLocation(program, "light.ambient"), ambientColor[0], ambientColor[1], ambientColor[2]);
  gl.uniform3f(gl.getUniformLocation(program, "light.diffuse"), diffuseColor[0], diffuseColor[1], diffuseColor[2]);
  gl.uniform3f(gl.getUniformLocation(program, "light.specular"), 1.0, 1.0, 1.0);
}

function detectCollisions() {
  var angle = 0;
  var i = 0;
  for (i = 0; i < numObstacles; i++) {
    angle = Math.atan(models["obstacle" + i].scale[1] / models["obstacle" + i].scale[0]) * 180 / Math.PI;
    if (window.octAngle % 180 >= models["obstacle" + i].rotateAngle2 % 180 - angle && window.octAngle % 180 <= models["obstacle" + i].rotateAngle2 % 180 + angle && window.revolveAngle % 360 <= models["obstacle" + i].rotateAngle1 + 4 && window.revolveAngle % 360 >= models["obstacle" + i].rotateAngle1 - 4) {
      window.playFlag = 0;
      document.getElementById('gameOverContainer').style.visibility = "visible";
      document.getElementById('scoreContainer').style.visibility = "hidden";
      document.getElementById('gameOver').innerText = "GAME OVER \n\n SCORE: " + window.score + "\n\n" + "LEVEL: " + window.level;
    }
  }
  if (window.level >= 2) {
    for (i = 0; i < numObstacles2; i++) {

      angle = Math.atan(models["obstacleBig" + i].scale[1] / models["obstacleBig" + i].scale[0]) * 180 / Math.PI;
      if (window.octAngle % 180 >= models["obstacleBig" + i].rotateAngle2 % 180 - angle && window.octAngle % 180 <= models["obstacleBig" + i].rotateAngle2 % 180 + angle && window.revolveAngle % 360 <= models["obstacleBig" + i].rotateAngle1 + 4 && window.revolveAngle % 360 >= models["obstacleBig" + i].rotateAngle1 - 4) {
        window.playFlag = 0;
        document.getElementById('gameOverContainer').style.visibility = "visible";
        document.getElementById('scoreContainer').style.visibility = "hidden";
        document.getElementById('gameOver').innerText = "GAME OVER \n\n SCORE: " + window.score + "\n\n" + "LEVEL: " + window.level;
      }
    }
  }
}

/////////////////// HTML helper functions ////////////////
$("#welcomeContainer").click(function () {
  this.style.visibility = 'hidden';
});

$("#play").click(function () {
  window.playFlag = 1;
});

},{"./matrix":2,"./models":3,"./shaders":4,"./vector":5}],2:[function(require,module,exports){
'use strict';

var vec = require('./vector');

// 0 1 2 3        0 1 2 3
// 4 5 6 7        4 5 6 7
// 8 9 10 11      8 9 10 11
// 12 13 14 15    12 13 14 15
function matrixMultiply(mat2, mat1) {
  return [mat1[0] * mat2[0] + mat1[1] * mat2[4] + mat1[2] * mat2[8] + mat1[3] * mat2[12], mat1[0] * mat2[1] + mat1[1] * mat2[5] + mat1[2] * mat2[9] + mat1[3] * mat2[13], mat1[0] * mat2[2] + mat1[1] * mat2[6] + mat1[2] * mat2[10] + mat1[3] * mat2[14], mat1[0] * mat2[3] + mat1[1] * mat2[7] + mat1[2] * mat2[11] + mat1[3] * mat2[15], mat1[4] * mat2[0] + mat1[5] * mat2[4] + mat1[6] * mat2[8] + mat1[7] * mat2[12], mat1[4] * mat2[1] + mat1[5] * mat2[5] + mat1[6] * mat2[9] + mat1[7] * mat2[13], mat1[4] * mat2[2] + mat1[5] * mat2[6] + mat1[6] * mat2[10] + mat1[7] * mat2[14], mat1[4] * mat2[3] + mat1[5] * mat2[7] + mat1[6] * mat2[11] + mat1[7] * mat2[15], mat1[8] * mat2[0] + mat1[9] * mat2[4] + mat1[10] * mat2[8] + mat1[11] * mat2[12], mat1[8] * mat2[1] + mat1[9] * mat2[5] + mat1[10] * mat2[9] + mat1[11] * mat2[13], mat1[8] * mat2[2] + mat1[9] * mat2[6] + mat1[10] * mat2[10] + mat1[11] * mat2[14], mat1[8] * mat2[3] + mat1[9] * mat2[7] + mat1[10] * mat2[11] + mat1[11] * mat2[15], mat1[12] * mat2[0] + mat1[13] * mat2[4] + mat1[14] * mat2[8] + mat1[15] * mat2[12], mat1[12] * mat2[1] + mat1[13] * mat2[5] + mat1[14] * mat2[9] + mat1[15] * mat2[13], mat1[12] * mat2[2] + mat1[13] * mat2[6] + mat1[14] * mat2[10] + mat1[15] * mat2[14], mat1[12] * mat2[3] + mat1[13] * mat2[7] + mat1[14] * mat2[11] + mat1[15] * mat2[15]];
}

function matrixMultiply4x1(mat1, mat2) {
  return [mat1[0] * mat2[0] + mat1[1] * mat2[1] + mat1[2] * mat2[2] + mat1[3] * mat1[3], mat1[4] * mat2[0] + mat1[5] * mat2[1] + mat1[6] * mat2[2] + mat1[7] * mat1[3], mat1[8] * mat2[0] + mat1[9] * mat2[1] + mat1[10] * mat2[2] + mat1[11] * mat1[3], mat1[12] * mat2[0] + mat1[13] * mat2[1] + mat1[14] * mat2[2] + mat1[15] * mat1[3]];
}

function multiply(m1, m2) {
  if (m2.length == 4) return matrixMultiply4x1(m1, m2);else return matrixMultiply(m1, m2);
}

function inverse(a) {
  var s0 = a[0] * a[5] - a[4] * a[1];
  var s1 = a[0] * a[6] - a[4] * a[2];
  var s2 = a[0] * a[7] - a[4] * a[3];
  var s3 = a[1] * a[6] - a[5] * a[2];
  var s4 = a[1] * a[7] - a[5] * a[3];
  var s5 = a[2] * a[7] - a[6] * a[3];

  var c5 = a[10] * a[15] - a[14] * a[11];
  var c4 = a[9] * a[15] - a[13] * a[11];
  var c3 = a[9] * a[14] - a[13] * a[10];
  var c2 = a[8] * a[15] - a[12] * a[11];
  var c1 = a[8] * a[14] - a[12] * a[10];
  var c0 = a[8] * a[13] - a[12] * a[9];

  //console.log(c5,s5,s4);

  // Should check for 0 determinant
  var invdet = 1.0 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);

  var b = [[], [], [], []];

  b[0] = (a[5] * c5 - a[6] * c4 + a[7] * c3) * invdet;
  b[1] = (-a[1] * c5 + a[2] * c4 - a[3] * c3) * invdet;
  b[2] = (a[13] * s5 - a[14] * s4 + a[15] * s3) * invdet;
  b[3] = (-a[9] * s5 + a[10] * s4 - a[11] * s3) * invdet;

  b[4] = (-a[4] * c5 + a[6] * c2 - a[7] * c1) * invdet;
  b[5] = (a[0] * c5 - a[2] * c2 + a[3] * c1) * invdet;
  b[6] = (-a[12] * s5 + a[14] * s2 - a[15] * s1) * invdet;
  b[7] = (a[8] * s5 - a[10] * s2 + a[11] * s1) * invdet;

  b[8] = (a[4] * c4 - a[5] * c2 + a[7] * c0) * invdet;
  b[9] = (-a[0] * c4 + a[1] * c2 - a[3] * c0) * invdet;
  b[10] = (a[12] * s4 - a[13] * s2 + a[15] * s0) * invdet;
  b[11] = (-a[8] * s4 + a[9] * s2 - a[11] * s0) * invdet;

  b[12] = (-a[4] * c3 + a[5] * c1 - a[6] * c0) * invdet;
  b[13] = (a[0] * c3 - a[1] * c1 + a[2] * c0) * invdet;
  b[14] = (-a[12] * s3 + a[13] * s1 - a[14] * s0) * invdet;
  b[15] = (a[8] * s3 - a[9] * s1 + a[10] * s0) * invdet;

  return b;
}

function perspective(fieldOfViewInRadians, aspect, near, far) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);

  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0];
}

function makeZToWMatrix(fudgeFactor) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, fudgeFactor, 0, 0, 0, 1];
}

function translate(tx, ty, tz) {
  if (typeof tx != 'number') {
    var old = tx;
    tx = old[0];
    ty = old[1];
    tz = old[2];
  }
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1];
}

function rotateX(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

function rotateY(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

function rotateZ(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function scale(sx, sy, sz) {
  if (typeof sx != 'number') {
    var old = sx;
    sx = old[0];
    sy = old[1];
    sz = old[2];
  }
  return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
}

function lookAt(eye, target, up) {
  var f = vec.normalize(vec.subtract(target, eye));
  var s = vec.normalize(vec.cross(f, up));
  var u = vec.cross(s, f);

  var result = identity();
  result[4 * 0 + 0] = s[0];
  result[4 * 1 + 0] = s[1];
  result[4 * 2 + 0] = s[2];
  result[4 * 0 + 1] = u[0];
  result[4 * 1 + 1] = u[1];
  result[4 * 2 + 1] = u[2];
  result[4 * 0 + 2] = -f[0];
  result[4 * 1 + 2] = -f[1];
  result[4 * 2 + 2] = -f[2];
  result[4 * 3 + 0] = -vec.dot(s, eye);
  result[4 * 3 + 1] = -vec.dot(u, eye);
  result[4 * 3 + 2] = vec.dot(f, eye);
  return result;
}

function identity() {
  return scale(1, 1, 1);
}

module.exports = {
  multiply: multiply,
  inverse: inverse,
  identity: identity,

  perspective: perspective,
  makeZToWMatrix: makeZToWMatrix,
  lookAt: lookAt,

  translate: translate,
  rotateX: rotateX, rotateY: rotateY, rotateZ: rotateZ,
  scale: scale
};

},{"./vector":5}],3:[function(require,module,exports){
'use strict';

var m = require('./matrix');

function openFile(name, filename) {
  var datastring;
  $.ajax({
    url: filename + '.obj',
    dataType: "text",
    success: function success(data) {
      datastring = data;
      $.ajax({
        url: filename + '.mtl',
        dataType: "text",
        success: function success(mtlstring) {
          createModel(name, datastring, mtlstring);
        }
      });
    }
  });
}

function makeModel(name, filename) {
  var center = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [0, 0, 0];
  var scale = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [1, 1, 1];
  var rotateAngle1 = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  var rotateAngle2 = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
  var rotationSpeed = arguments[6];

  models[name] = { name: name, center: center, scale: scale, rotateAngle1: rotateAngle1, rotateAngle2: rotateAngle2, rotationSpeed: rotationSpeed };
  openFile(name, filename);
}

function parseMtl(mtlstring) {
  var mtllib = {};
  var lines = mtlstring.split('\n');
  var curmtl = '';
  for (var j = 0; j < lines.length; j++) {
    var words = lines[j].split(' ');
    if (words[0] == 'newmtl') {
      curmtl = words[1];
      mtllib[curmtl] = {};
    } else if (words[0] == 'Kd') {
      mtllib[curmtl].diffuse = [parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])];
    } else if (words[0] == 'Ks') {
      mtllib[curmtl].specular = [parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])];
    } else if (words[0] == 'Ka') {
      mtllib[curmtl].ambient = [parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])];
    } else if (words[0] == 'Ns') {
      mtllib[curmtl].shininess = parseFloat(words[1]);
    } else if (words[0] == 'map_Kd') {
      loadTexture(words[1], mtllib[curmtl]);
    }
  }
  return mtllib;
}

function handleLoadedTexture(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

function loadTexture(src, material) {
  var texture = gl.createTexture();
  texture.image = new Image();
  texture.image.onload = function () {
    handleLoadedTexture(texture);
    material.texture = texture;
  };
  texture.image.src = src;
  return texture;
}

function createModel(name, filedata, mtlstring) //Create object from blender
{
  var model = models[name];
  var mtllib = parseMtl(mtlstring);
  var vertex_buffer_data = [];
  var points = [];
  var minX = 1000000;
  var maxX = -1000000;
  var minY = 1000000;
  var maxY = -1000000;
  var minZ = 1000000;
  var maxZ = -1000000;

  var invertNormals = false;
  var normals = [];
  var normal_buffer_data = [];

  var textures = [];
  var texture_buffer_data = [];

  model.vaos = [];

  var lines = filedata.split('\n');
  lines = lines.map(function (s) {
    return s.trim();
  });
  lines.push('usemtl');
  for (var j = 0; j < lines.length; j++) {
    var words = lines[j].split(' ');
    if (words[0] == "v") {
      var cur_point = {};
      cur_point['x'] = parseFloat(words[1]);
      if (cur_point['x'] > maxX) {
        maxX = cur_point['x'];
      }
      if (cur_point['x'] < minX) {
        minX = cur_point['x'];
      }
      cur_point['y'] = parseFloat(words[2]);
      if (cur_point['y'] > maxY) {
        maxY = cur_point['y'];
      }
      if (cur_point['y'] < minY) {
        minY = cur_point['y'];
      }
      cur_point['z'] = parseFloat(words[3]);
      if (cur_point['z'] > maxZ) {
        maxZ = cur_point['z'];
      }
      if (cur_point['z'] < minZ) {
        minZ = cur_point['z'];
      }
      //console.log(words);
      points.push(cur_point);
    } else if (words[0] == "vn") {
      var _cur_point = {};
      _cur_point['x'] = parseFloat(words[1]);
      _cur_point['y'] = parseFloat(words[2]);
      _cur_point['z'] = parseFloat(words[3]);
      //console.log(words);
      normals.push(_cur_point);
    } else if (words[0] == "vt") {
      var _cur_point2 = {};
      _cur_point2.s = parseFloat(words[1]);
      _cur_point2.t = parseFloat(words[2]);
      textures.push(_cur_point2);
    }
  }
  model.minX = minX;
  model.maxX = maxX;
  model.minY = minY;
  model.maxY = maxY;
  model.minZ = minZ;
  model.maxZ = maxZ;
  //console.log(points);
  // let lines = filedata.split('\n');
  var curmtl = '';
  for (var jj = 0; jj < lines.length; jj++) {
    var _words = lines[jj].split(' ');
    if (_words[0] == "f") {
      for (var wc = 1; wc < 4; wc++) {
        var vxdata = _words[wc].split('/');
        var p = parseInt(vxdata[0]) - 1;
        var t = parseInt(vxdata[1]) - 1;
        var n = parseInt(vxdata[2]) - 1;
        vertex_buffer_data.push(points[p].x);
        vertex_buffer_data.push(points[p].y);
        vertex_buffer_data.push(points[p].z);

        if (!isNaN(t)) {
          texture_buffer_data.push(textures[t].s);
          texture_buffer_data.push(textures[t].t);
        }

        if (invertNormals) {
          normal_buffer_data.push(-normals[n].x);
          normal_buffer_data.push(-normals[n].y);
          normal_buffer_data.push(-normals[n].z);
        } else {
          normal_buffer_data.push(normals[n].x);
          normal_buffer_data.push(normals[n].y);
          normal_buffer_data.push(normals[n].z);
        }
      }
    } else if (_words[0] == 'usemtl') {
      var vao = {};
      vao.numVertex = vertex_buffer_data.length / 3;
      if (vao.numVertex != 0) {
        var vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_buffer_data), gl.STATIC_DRAW);
        vao.vertexBuffer = vertexBuffer;

        var normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normal_buffer_data), gl.STATIC_DRAW);
        vao.normalBuffer = normalBuffer;

        var textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        if (texture_buffer_data.length > 0) {
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_buffer_data), gl.STATIC_DRAW);
          vao.isTextured = true;
        } else {
          for (var i = 0; i < 2 * vao.numVertex; i++) {
            texture_buffer_data.push(0);
          }gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_buffer_data), gl.STATIC_DRAW);
          vao.isTextured = false;
        }
        vao.textureBuffer = textureBuffer;

        vao.material = mtllib[curmtl];

        model.vaos.push(vao);
        vertex_buffer_data = [];
        normal_buffer_data = [];
        texture_buffer_data = [];
      } else if (_words[0] == 'invertNormals') {
        invertNormals = !invertNormals;
      }
      curmtl = _words[1];
    }
  }
}

function drawModel(model) {
  if (!model.vaos) return;
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, Matrices.model);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelInv"), false, m.inverse(Matrices.model));

  model.vaos.map(drawVAO);
}

function drawLight(model) {
  gl.uniform1i(gl.getUniformLocation(program, "isLight"), 1);
  drawModel(model);
  gl.uniform1i(gl.getUniformLocation(program, "isLight"), 0);
}

function drawVAO(vao) {
  if (!vao.vertexBuffer) return;

  loadMaterial(vao.material);

  gl.bindBuffer(gl.ARRAY_BUFFER, vao.vertexBuffer);
  gl.vertexAttribPointer(program.positionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, vao.normalBuffer);
  gl.vertexAttribPointer(program.normalAttribute, 3, gl.FLOAT, false, 0, 0);

  var isTextured = vao.material.texture && vao.isTextured;
  // console.log(isTextured)
  gl.uniform1i(gl.getUniformLocation(program, "isTextured"), isTextured);
  gl.bindBuffer(gl.ARRAY_BUFFER, vao.textureBuffer);
  gl.vertexAttribPointer(program.textureAttribute, 2, gl.FLOAT, false, 0, 0);
  if (isTextured) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, vao.material.texture);
    gl.uniform1i(gl.getUniformLocation(program, "sampler"), 0);
  }

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, vao.numVertex);
}

function loadMaterial(material) {
  if (!material) material = {
    ambient: [1, 1, 1],
    diffuse: [1, 1, 1],
    specular: [1, 1, 1],
    shininess: 0
  };
  // Set material properties
  gl.uniform3f(gl.getUniformLocation(program, "material.ambient"), material.ambient[0], material.ambient[1], material.ambient[2]);
  gl.uniform3f(gl.getUniformLocation(program, "material.diffuse"), material.diffuse[0], material.diffuse[1], material.diffuse[2]);
  gl.uniform3f(gl.getUniformLocation(program, "material.specular"), material.specular[0], material.specular[1], material.specular[2]);
  gl.uniform1f(gl.getUniformLocation(program, "material.shininess"), material.shininess);
}

module.exports = {
  makeModel: makeModel,
  createModel: createModel,
  drawModel: drawModel,
  drawLight: drawLight
};

},{"./matrix":2}],4:[function(require,module,exports){
"use strict";

var shaders = {};

function compileShader(gl, shaderSource, shaderType) {
  // Create the shader object
  var shader = gl.createShader(shaderType);

  // Set the shader source code.
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check if it compiled
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    // Something went wrong during compilation; get the error
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }

  return shader;
}

function createProgram(gl, name, vertexShader, fragmentShader) {
  // create a program.
  var progra = gl.createProgram();

  // attach the shaders.
  gl.attachShader(progra, vertexShader);
  gl.attachShader(progra, fragmentShader);

  // link the program.
  gl.linkProgram(progra);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  // Check if it linked.
  var success = gl.getProgramParameter(progra, gl.LINK_STATUS);
  if (!success) {
    // something went wrong with the link
    throw "program filed to link:" + gl.getProgramInfoLog(progra);
  }

  window.program = progra;
  program.positionAttribute = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(program.vertexAttribute);

  program.normalAttribute = gl.getAttribLocation(program, "a_normal");
  gl.enableVertexAttribArray(program.normalAttribute);

  program.textureAttribute = gl.getAttribLocation(program, "a_texture");
  gl.enableVertexAttribArray(program.textureAttribute);

  shaders[name] = progra;
}

function openFile(name, filename) {
  $.get(filename + '.vs', function (vxShaderData) {
    var vxShader = compileShader(gl, vxShaderData, gl.VERTEX_SHADER);
    $.get(filename + '.frag', function (fragShaderData) {
      var fragShader = compileShader(gl, fragShaderData, gl.FRAGMENT_SHADER);
      createProgram(gl, name, vxShader, fragShader);
    }, 'text');
  }, 'text');
}

function createShader(shadername) {
  //for django website; /static/tunnel_rush/shaders is taken as url, without '/' in front, it is taken as file path.
  openFile(shadername, '/static/tunnel_rush/shaders/' + shadername);
  // openFile(shadername, 'shaders/' + shadername)
}

function useShader(shadername) {
  window.program = shaders[shadername];
  gl.useProgram(window.program);
}

module.exports = {
  compileShader: compileShader,
  createShader: createShader,
  useShader: useShader
};

},{}],5:[function(require,module,exports){
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function dot(_ref, _ref2) {
  var _ref4 = _slicedToArray(_ref, 3),
      x = _ref4[0],
      y = _ref4[1],
      z = _ref4[2];

  var _ref3 = _slicedToArray(_ref2, 3),
      p = _ref3[0],
      q = _ref3[1],
      r = _ref3[2];

  return x * p + y * q + z * r;
}

function cross(_ref5, _ref6) {
  var _ref8 = _slicedToArray(_ref5, 3),
      ux = _ref8[0],
      uy = _ref8[1],
      uz = _ref8[2];

  var _ref7 = _slicedToArray(_ref6, 3),
      vx = _ref7[0],
      vy = _ref7[1],
      vz = _ref7[2];

  var x = uy * vz - uz * vy;
  var y = uz * vx - ux * vz;
  var z = ux * vy - uy * vx;
  return [x, y, z];
}

function add(_ref9, _ref10) {
  var _ref12 = _slicedToArray(_ref9, 3),
      x = _ref12[0],
      y = _ref12[1],
      z = _ref12[2];

  var _ref11 = _slicedToArray(_ref10, 3),
      p = _ref11[0],
      q = _ref11[1],
      r = _ref11[2];

  return [x + p, y + q, z + r];
}

function subtract(_ref13, _ref14) {
  var _ref16 = _slicedToArray(_ref13, 3),
      x = _ref16[0],
      y = _ref16[1],
      z = _ref16[2];

  var _ref15 = _slicedToArray(_ref14, 3),
      p = _ref15[0],
      q = _ref15[1],
      r = _ref15[2];

  return [x - p, y - q, z - r];
}

function abs(_ref17) {
  var _ref18 = _slicedToArray(_ref17, 3),
      x = _ref18[0],
      y = _ref18[1],
      z = _ref18[2];

  return Math.sqrt(x * x + y * y + z * z);
}

function normalize(_ref19) {
  var _ref20 = _slicedToArray(_ref19, 3),
      x = _ref20[0],
      y = _ref20[1],
      z = _ref20[2];

  var t = abs([x, y, z]);
  return [x / t, y / t, z / t];
}

function multiplyScalar(_ref21, c) {
  var _ref22 = _slicedToArray(_ref21, 3),
      x = _ref22[0],
      y = _ref22[1],
      z = _ref22[2];

  return [x * c, y * c, z * c];
}

module.exports = {
  dot: dot,
  cross: cross,
  add: add,
  subtract: subtract,
  abs: abs,
  normalize: normalize,
  multiplyScalar: multiplyScalar
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWMvdHVubmVsX3J1c2gvanMvbWFpbi5qcyIsInN0YXRpYy90dW5uZWxfcnVzaC9qcy9tYXRyaXguanMiLCJzdGF0aWMvdHVubmVsX3J1c2gvanMvbW9kZWxzLmpzIiwic3RhdGljL3R1bm5lbF9ydXNoL2pzL3NoYWRlcnMuanMiLCJzdGF0aWMvdHVubmVsX3J1c2gvanMvdmVjdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFJLFVBQVUsUUFBUSxXQUFSLENBQWQ7O2VBQzhCLFFBQVEsVUFBUixDO0lBQXhCLFMsWUFBQSxTO0lBQVcsUyxZQUFBLFM7O0FBQ2pCLElBQUksSUFBSSxRQUFRLFVBQVIsQ0FBUjtBQUNBLElBQUksTUFBTSxRQUFRLFVBQVIsQ0FBVjs7QUFFQSxPQUFPLFFBQVAsR0FBa0IsQ0FBbEI7QUFDQSxPQUFPLFNBQVAsR0FBbUIsQ0FBbkI7QUFDQSxPQUFPLFdBQVAsR0FBcUIsQ0FBckI7QUFDQSxPQUFPLEtBQVAsR0FBZSxDQUFmO0FBQ0EsT0FBTyxLQUFQLEdBQWUsQ0FBZjtBQUNBLE9BQU8sUUFBUCxHQUFrQixDQUFsQjtBQUNBLE9BQU8sS0FBUCxHQUFlLENBQWY7QUFDQSxPQUFPLEtBQVAsR0FBZSxDQUFmO0FBQ0EsT0FBTyxTQUFQLEdBQW1CLENBQUMsRUFBcEI7O0FBRUEsSUFBSSxlQUFlLENBQW5CO0FBQ0EsSUFBSSxnQkFBZ0IsQ0FBcEI7QUFDQTtBQUNBLElBQUksT0FBTyxDQUFYO0FBQ0EsSUFBSSxTQUFTLENBQWI7QUFDQSxJQUFJLFNBQVMsQ0FBYjtBQUNBLElBQUksU0FBUyxDQUFiOztBQUVBLElBQUksS0FBSyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQUFUO0FBQ0EsSUFBSSxjQUFjLE9BQU8sTUFBekI7QUFDQSxJQUFJLGdCQUFnQixXQUFwQjtBQUNBLE9BQU8sWUFBUCxHQUFzQixDQUF0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RSxDQUFILEVBQU0sSUFBRSxDQUFSLEVBQVcsSUFBRSxDQUFiLENBQVA7QUFDRDs7QUFFRCxTQUFTLGNBQVQsU0FBbUMsQ0FBbkMsRUFBc0M7QUFBQTtBQUFBLE1BQWIsQ0FBYTtBQUFBLE1BQVYsQ0FBVTtBQUFBLE1BQVAsQ0FBTzs7QUFDcEMsU0FBTyxDQUFDLElBQUUsQ0FBSCxFQUFNLElBQUUsQ0FBUixFQUFXLElBQUUsQ0FBYixDQUFQO0FBQ0Q7O0FBRUQsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsVUFEZTtBQUVmLGNBRmU7QUFHZixVQUhlO0FBSWYsb0JBSmU7QUFLZixVQUxlO0FBTWYsc0JBTmU7QUFPZjtBQVBlLENBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwidmFyIHNoYWRlcnMgPSByZXF1aXJlKCcuL3NoYWRlcnMnKVxudmFyIHsgZHJhd01vZGVsLCBtYWtlTW9kZWx9ID0gcmVxdWlyZSgnLi9tb2RlbHMnKVxudmFyIG0gPSByZXF1aXJlKCcuL21hdHJpeCcpXG52YXIgdmVjID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuXG53aW5kb3cucGxheUZsYWcgPSAwO1xud2luZG93LmdyYXlTY2FsZSA9IDA7XG53aW5kb3cubmlnaHRWaXNpb24gPSAwO1xud2luZG93LmdGbGFnID0gMTtcbndpbmRvdy5uRmxhZyA9IDE7XG53aW5kb3cudmVsb2NpdHkgPSAxO1xud2luZG93LmxldmVsID0gMTtcbndpbmRvdy5zY29yZSA9IDA7XG53aW5kb3cucHJldlNjb3JlID0gLTEwO1xuXG52YXIgbnVtT2JzdGFjbGVzID0gNztcbnZhciBudW1PYnN0YWNsZXMyID0gNTtcbi8vIHZhciBub3cgPSAwO1xudmFyIHRoZW4gPSAwO1xudmFyIHNjYWxleCA9IDE7XG52YXIgc2NhbGV5ID0gMTtcbnZhciBzY2FsZXogPSAxO1xuXG52YXIgdXAgPSBbMCwgMSwgMF07XG52YXIgb3V0ZXJSYWRpdXMgPSA1MC4wICogc2NhbGV4O1xudmFyIHJldm9sdmVSYWRpdXMgPSBvdXRlclJhZGl1cztcbndpbmRvdy5yZXZvbHZlQW5nbGUgPSAwO1xud2luZG93LnJldm9sdmVTcGVlZCA9IDI1O1xuXG53aW5kb3cub2N0UmFkaXVzID0gNSAqIHNjYWxleDtcbndpbmRvdy5vY3RBbmdsZSA9IDI3MDtcbndpbmRvdy5vY3RTcGVlZCA9IDI1MDtcbndpbmRvdy5vY3RTdGVwc0EgPSAwO1xud2luZG93Lm9jdFN0ZXBzRCA9IDA7XG53aW5kb3cuTWF0cmljZXMgPSB7fVxud2luZG93Lm1vZGVscyA9IHt9XG53aW5kb3cua2V5TWFwID0ge31cblxudmFyIENhbWVyYSA9IHtcbiAgeDogcmV2b2x2ZVJhZGl1cyxcbiAgeTogMCxcbiAgejogMCxcbiAgbG9va3g6IDAsXG4gIGxvb2t5OiAwLFxuICBsb29rejogMCxcbiAgdGVtcHg6IDAsXG4gIHRlbXB6OiAwLFxufVxuXG53aW5kb3cuSW5pdGlhbGl6ZSA9IEluaXRpYWxpemVcbndpbmRvdy5DYW1lcmEgPSBDYW1lcmFcblxuZnVuY3Rpb24gSW5pdGlhbGl6ZSgpIHtcbiAgLy8gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JhY2thdWRpbycpLnBsYXkoKTtcbiAgd2luZG93LmNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFzXCIpO1xuICByZXNpemVDYW52YXMoKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZUNhbnZhcyk7XG5cbiAgd2luZG93LmdsID0gY2FudmFzLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIik7XG4gIGdsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMS4wKTtcblxuICAvLyBzZXR1cCBhIEdMU0wgcHJvZ3JhbVxuICBzaGFkZXJzLmNyZWF0ZVNoYWRlcignbWF0ZXJpYWwnKVxuXG4gIC8vIFBJUEUgTU9ERUxcbiAgLy8gJy8nIGluIGZyb250IG9mIHN0YXRpYyBtZWFucyB1cmwgaW4ganM7IHdpdGhvdXQgaXQsIGl0IGlzIHRha2VuIGFzIGZpbGUgcGF0aC5cbiAgbWFrZU1vZGVsKCdwaXBlJywgJy9zdGF0aWMvdHVubmVsX3J1c2gvb2JqZWN0cy9waXBlJywgWzAsIDAsIDBdLCBbc2NhbGV4LCBzY2FsZXksIHNjYWxlel0sIFswLCAwLCAwXSkgLy9yb3RhdGUgZHVtbXkgdmFsdWUgPSBbMCwgMCwgMF1cbiAgLy8gbWFrZU1vZGVsKCdwaXBlJywgJ2Fzc2V0cy9waXBlJywgWzAsIDAsIDBdLCBbc2NhbGV4LCBzY2FsZXksIHNjYWxlel0sIFswLCAwLCAwXSkgLy9yb3RhdGUgZHVtbXkgdmFsdWUgPSBbMCwgMCwgMF1cblxuICAvL09CU1RBQ0xFUyBNT0RFTFNcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1PYnN0YWNsZXM7IGkrKykge1xuICAgIHZhciByYW5kTnVtID0gKE1hdGgucmFuZG9tKCkgKyBNYXRoLnJhbmRvbSgpICsgTWF0aC5yYW5kb20oKSArIE1hdGgucmFuZG9tKCkpIC8gNDtcbiAgICB2YXIgdGVtcCA9IChyYW5kTnVtICogMTAwMCAlIDM2MCkgLSAzNjA7XG4gICAgbWFrZU1vZGVsKCdvYnN0YWNsZScgKyBpLCAnL3N0YXRpYy90dW5uZWxfcnVzaC9vYmplY3RzL2N1YmV0ZXgnLCBbcmV2b2x2ZVJhZGl1cyAqIE1hdGguY29zKHRvUmFkaWFucyh0ZW1wKSksIDAsIHJldm9sdmVSYWRpdXMgKiBNYXRoLnNpbih0b1JhZGlhbnModGVtcCkpXSxcbiAgICAvLyBtYWtlTW9kZWwoJ29ic3RhY2xlJyArIGksICdhc3NldHMvY3ViZXRleCcsIFtyZXZvbHZlUmFkaXVzICogTWF0aC5jb3ModG9SYWRpYW5zKHRlbXApKSwgMCwgcmV2b2x2ZVJhZGl1cyAqIE1hdGguc2luKHRvUmFkaWFucyh0ZW1wKSldLFxuICAgICAgWzgsIDEsIDFdLCAvL3NjYWxlXG4gICAgICB0ZW1wLCAvL3JvdGF0ZUFuZ2xlMVxuICAgICAgTWF0aC5yYW5kb20oKSAqIDEwMDAgJSAzNjAsIC8vcm90YXRlQW5nbGUyXG4gICAgICAwKVxuICB9XG4gIC8vc3RhcnQgdGhlIGFuaW1hdGlvblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG59XG5cbmZ1bmN0aW9uIHRvUmFkaWFucyAoYW5nbGUpIHtcbiAgcmV0dXJuIGFuZ2xlICogKE1hdGguUEkgLyAxODApO1xufVxuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleUNoZWNrZXIpXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBrZXlDaGVja2VyKVxuXG5mdW5jdGlvbiBrZXlDaGVja2VyIChrZXkpIHtcbiAgd2luZG93LmtleU1hcFtrZXkua2V5Q29kZV0gPSAoa2V5LnR5cGUgPT0gXCJrZXlkb3duXCIpXG59XG5cbmZ1bmN0aW9uIGtleUltcGxlbWVudGF0aW9uICgpIHtcbiAgaWYgKHdpbmRvdy5rZXlNYXBbMzddKSB7XG4gICAgd2luZG93Lm9jdFN0ZXBzQSAtPSAxO1xuICB9XG4gIGVsc2UgaWYgKHdpbmRvdy5rZXlNYXBbNjldKSB7XG4gICAgd2luZG93Lm9jdFN0ZXBzRCAtPSAxO1xuICB9XG4gIC8vRk9SIGZvcndhcmQgYW5kIGJhY2t3YXJkXG4gIC8vIGVsc2UgaWYgKHdpbmRvdy5rZXlNYXBbODddKSB7XG4gIC8vICAgd2luZG93LnJldm9sdmVBbmdsZSAtPSAwLjE7XG4gIC8vIH1cbiAgLy8gZWxzZSBpZiAod2luZG93LmtleU1hcFs4M10pIHtcbiAgLy8gICB3aW5kb3cucmV2b2x2ZUFuZ2xlICs9IDAuMTtcbiAgLy8gfVxuICBlbHNlIGlmICh3aW5kb3cua2V5TWFwWzcxXSAmJiB3aW5kb3cuZ0ZsYWcpIHtcbiAgICB3aW5kb3cuZ3JheVNjYWxlID0gIXdpbmRvdy5ncmF5U2NhbGU7XG4gICAgd2luZG93LmdGbGFnID0gMDtcbiAgICBnbC51bmlmb3JtMWkoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sICdncmF5U2NhbGUnKSwgd2luZG93LmdyYXlTY2FsZSk7XG4gIH1cbiAgZWxzZSBpZiAod2luZG93LmtleU1hcFs3OF0gJiYgd2luZG93Lm5GbGFnKSB7XG4gICAgd2luZG93Lm5pZ2h0VmlzaW9uID0gIXdpbmRvdy5uaWdodFZpc2lvbjtcbiAgICB3aW5kb3cubkZsYWcgPSAwO1xuICAgIGdsLnVuaWZvcm0xaShnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgJ25pZ2h0VmlzaW9uJyksIHdpbmRvdy5uaWdodFZpc2lvbik7XG4gIH1cbiAgaWYgKCF3aW5kb3cua2V5TWFwWzcxXSkge1xuICAgIHdpbmRvdy5nRmxhZyA9IDE7XG4gIH1cbiAgaWYgKCF3aW5kb3cua2V5TWFwWzc4XSkge1xuICAgIHdpbmRvdy5uRmxhZyA9IDE7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXV0b01vdmVtZW50KCkge1xuXG4gIENhbWVyYS54ID0gcmV2b2x2ZVJhZGl1cyAqIE1hdGguY29zKHRvUmFkaWFucyh3aW5kb3cucmV2b2x2ZUFuZ2xlKSk7XG4gIENhbWVyYS56ID0gcmV2b2x2ZVJhZGl1cyAqIE1hdGguc2luKHRvUmFkaWFucyh3aW5kb3cucmV2b2x2ZUFuZ2xlKSk7XG4gIFxuICB3aW5kb3cub2N0QW5nbGUgKz0gTWF0aC5yb3VuZCh3aW5kb3cub2N0U3RlcHNBIC0gd2luZG93Lm9jdFN0ZXBzRCkgKiB3aW5kb3cuZGVsdGFUaW1lICogd2luZG93Lm9jdFNwZWVkO1xuICB2YXIgdGVtcHggPSB3aW5kb3cub2N0UmFkaXVzICogTWF0aC5jb3ModG9SYWRpYW5zKHdpbmRvdy5vY3RBbmdsZSkpICogTWF0aC5jb3ModG9SYWRpYW5zKHdpbmRvdy5yZXZvbHZlQW5nbGUpKTtcbiAgQ2FtZXJhLnkgPSB3aW5kb3cub2N0UmFkaXVzICogTWF0aC5zaW4odG9SYWRpYW5zKHdpbmRvdy5vY3RBbmdsZSkpO1xuICB2YXIgdGVtcHogPSB3aW5kb3cub2N0UmFkaXVzICogTWF0aC5jb3ModG9SYWRpYW5zKHdpbmRvdy5vY3RBbmdsZSkpICogTWF0aC5zaW4odG9SYWRpYW5zKHdpbmRvdy5yZXZvbHZlQW5nbGUpKTtcblxuICBDYW1lcmEueCArPSB0ZW1weDtcbiAgQ2FtZXJhLnogKz0gdGVtcHo7XG4gIHdpbmRvdy5vY3RTdGVwc0EgPSAwO1xuICB3aW5kb3cub2N0U3RlcHNEID0gMDtcblxuICB2YXIgbG9vayA9IHZlYy5ub3JtYWxpemUodmVjLmNyb3NzKHZlYy5ub3JtYWxpemUoW0NhbWVyYS54LCBDYW1lcmEueSwgQ2FtZXJhLnpdKSwgWzAsIDEsIDBdKSk7XG4gIENhbWVyYS5sb29reCA9IC1sb29rWzBdO1xuICBDYW1lcmEubG9va3kgPSAtbG9va1sxXTtcbiAgQ2FtZXJhLmxvb2t6ID0gLWxvb2tbMl07XG4gIFxuICBpZih3aW5kb3cucGxheUZsYWcgPT0gMSkge1xuICAgIHdpbmRvdy5yZXZvbHZlQW5nbGUgLT0gd2luZG93LnJldm9sdmVTcGVlZCAqIHdpbmRvdy5kZWx0YVRpbWU7XG4gIH1cbiAgQ2FtZXJhLnRlbXB4ID0gdGVtcHg7XG4gIENhbWVyYS50ZW1weiA9IHRlbXB6O1xuICB1cFswXSA9IE1hdGgucm91bmQoLXRlbXB4KTtcbiAgdXBbMV0gPSBNYXRoLnJvdW5kKC1DYW1lcmEueSk7XG4gIHVwWzJdID0gTWF0aC5yb3VuZCgtdGVtcHopXG59XG5cbmZ1bmN0aW9uIHJlc2l6ZUNhbnZhcygpIHtcbiAgd2luZG93LmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIHdpbmRvdy5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbn1cblxuZnVuY3Rpb24gdGljayhub3cpIHtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xuICBpZiAoIXdpbmRvdy5wcm9ncmFtKSByZXR1cm47XG4gIGFuaW1hdGUobm93KTtcbiAga2V5SW1wbGVtZW50YXRpb24oKTtcbiAgYXV0b01vdmVtZW50KCk7XG4gIGRyYXdTY2VuZSgpO1xuICBkZXRlY3RDb2xsaXNpb25zKCk7XG59XG5cbmZ1bmN0aW9uIGFuaW1hdGUobm93KSB7XG4gIGlmKHdpbmRvdy5wbGF5RmxhZykge1xuICAgIHdpbmRvdy5zY29yZSArKztcbiAgfVxuICBpZih3aW5kb3cuc2NvcmUgPT0gMzAwKSB7XG4gICAgd2luZG93LnByZXZTY29yZSA9IHdpbmRvdy5zY29yZTtcbiAgICB3aW5kb3cubGV2ZWwrKztcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgbnVtT2JzdGFjbGVzOyBpKyspIHtcbiAgICAgIHZhciByb3RhdGlvblNwZWVkID0gTWF0aC5yYW5kb20oKSAqICgxLjUgLSAwLjUgKyAxKSArIDAuNTtcbiAgICAgIG1vZGVsc1tcIm9ic3RhY2xlXCIgKyBpXS5yb3RhdGlvblNwZWVkID0gcm90YXRpb25TcGVlZDtcbiAgICB9XG4gICAgZm9yKGkgPSAwOyBpIDwgbnVtT2JzdGFjbGVzMjsgaSsrKSB7XG4gICAgICB2YXIgcmFuZE51bSA9IChNYXRoLnJhbmRvbSgpICsgTWF0aC5yYW5kb20oKSArIE1hdGgucmFuZG9tKCkgKyBNYXRoLnJhbmRvbSgpKSAvIDQ7XG4gICAgICB2YXIgdGVtcCA9IChyYW5kTnVtICogMTAwMCAlIDM2MCkgLSAzNjA7XG4gICAgICByb3RhdGlvblNwZWVkID0gTWF0aC5yYW5kb20oKSAqICgyLjUgLSAwLjUgKyAxKSArIDAuNTtcbiAgICAgIG1ha2VNb2RlbCgnb2JzdGFjbGVCaWcnICsgaSwgJy9zdGF0aWMvdHVubmVsX3J1c2gvb2JqZWN0cy9jdWJldGV4JywgW3Jldm9sdmVSYWRpdXMgKiBNYXRoLmNvcyh0b1JhZGlhbnModGVtcCkpLCAwLCByZXZvbHZlUmFkaXVzICogTWF0aC5zaW4odG9SYWRpYW5zKHRlbXApKV0sXG4gICAgICAvLyBtYWtlTW9kZWwoJ29ic3RhY2xlQmlnJyArIGksICdhc3NldHMvY3ViZXRleCcsIFtyZXZvbHZlUmFkaXVzICogTWF0aC5jb3ModG9SYWRpYW5zKHRlbXApKSwgMCwgcmV2b2x2ZVJhZGl1cyAqIE1hdGguc2luKHRvUmFkaWFucyh0ZW1wKSldLFxuICAgICAgICAvLyBbOCwgMiwgMV0sIC8vc2NhbGVcbiAgICAgICAgWzgsIDEsIDFdLCAvL3NjYWxlXG4gICAgICAgIHRlbXAsIC8vcm90YXRlQW5nbGUxXG4gICAgICAgIE1hdGgucmFuZG9tKCkgKiAxMDAwICUgMzYwLCAvL3JvdGF0ZUFuZ2xlMlxuICAgICAgICByb3RhdGlvblNwZWVkKVxuICAgIH1cbiAgfVxuICBpZiAod2luZG93LnNjb3JlID09IDIgKiB3aW5kb3cucHJldlNjb3JlICYmIHdpbmRvdy5zY29yZSA+IDE1MCkge1xuICAgIHdpbmRvdy5wcmV2U2NvcmUgPSB3aW5kb3cuc2NvcmU7XG4gICAgd2luZG93LmxldmVsKys7XG4gICAgd2luZG93LnJldm9sdmVTcGVlZCAqPSAxLjQ7XG4gICAgZm9yIChpID0gMDsgaSA8IG51bU9ic3RhY2xlczsgaSsrKSB7XG4gICAgICBtb2RlbHNbXCJvYnN0YWNsZVwiICsgaV0ucm90YXRpb25TcGVlZCAqPSAxLjI7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBudW1PYnN0YWNsZXMyOyBpKyspIHtcbiAgICAgIG1vZGVsc1tcIm9ic3RhY2xlQmlnXCIgKyBpXS5yb3RhdGlvblNwZWVkICo9IDEuMjtcbiAgICB9XG4gIH1cbiAgaWYod2luZG93LnJldm9sdmVTcGVlZCA+IDUwKVxuICAgIHdpbmRvdy5yZXZvbHZlU3BlZWQgPSA1MDtcbiAgdmFyIHNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlJylcbiAgc2NvcmUuaW5uZXJUZXh0ID0gJ1NDT1JFOiAnICsgd2luZG93LnNjb3JlICsgJ1xcblxcbicgKyAnTEVWRUw6ICcgKyB3aW5kb3cubGV2ZWw7XG4gIG5vdyAqPSAwLjAwMDg1O1xuICB3aW5kb3cuZGVsdGFUaW1lID0gbm93IC0gdGhlbjtcbiAgdXBkYXRlQ2FtZXJhKCk7XG4gIHRoZW4gPSBub3c7XG59XG5cbmZ1bmN0aW9uIGRyYXdTY2VuZSgpIHtcbiAgZ2wudmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgZ2wuY2xlYXJDb2xvcigwLjEsIDAuMSwgMC4xLCAxLjApO1xuICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gIHNoYWRlcnMudXNlU2hhZGVyKCdtYXRlcmlhbCcpXG4gIFxuICBnbC5lbmFibGUoZ2wuREVQVEhfVEVTVCk7XG4gIGdsLmRlcHRoRnVuYyhnbC5MRVFVQUwpO1xuXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBudW1PYnN0YWNsZXM7IGkrKykge1xuICAgIE1hdHJpY2VzLm1vZGVsID0gbS5tdWx0aXBseShtLnRyYW5zbGF0ZShtb2RlbHNbXCJvYnN0YWNsZVwiICsgaV0uY2VudGVyKSxcbiAgICAgIG0ubXVsdGlwbHkobS5yb3RhdGVZKHRvUmFkaWFucygtbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMSkpLFxuICAgICAgICBtLm11bHRpcGx5KG0ucm90YXRlWih0b1JhZGlhbnMobW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMiArPSBtb2RlbHNbXCJvYnN0YWNsZVwiICsgaV0ucm90YXRpb25TcGVlZCkpLFxuICAgICAgICAgIG0uc2NhbGUobW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnNjYWxlKSkpKTtcbiAgICBkcmF3TW9kZWwobW9kZWxzW1wib2JzdGFjbGVcIiArIGldKTtcbiAgfVxuXG4gIGlmKHdpbmRvdy5sZXZlbCA+PSAyKSB7XG4gICAgZm9yKGkgPSAwOyBpIDwgbnVtT2JzdGFjbGVzMjsgaSsrKSB7XG4gICAgICBNYXRyaWNlcy5tb2RlbCA9IG0ubXVsdGlwbHkobS50cmFuc2xhdGUobW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLmNlbnRlciksXG4gICAgICAgIG0ubXVsdGlwbHkobS5yb3RhdGVZKHRvUmFkaWFucygtbW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLnJvdGF0ZUFuZ2xlMSkpLFxuICAgICAgICAgIG0ubXVsdGlwbHkobS5yb3RhdGVaKHRvUmFkaWFucyhtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0ucm90YXRlQW5nbGUyICs9IG1vZGVsc1tcIm9ic3RhY2xlQmlnXCIgKyBpXS5yb3RhdGlvblNwZWVkKSksXG4gICAgICAgICAgICBtLnNjYWxlKG1vZGVsc1tcIm9ic3RhY2xlQmlnXCIgKyBpXS5zY2FsZSkpKSk7XG4gICAgICBkcmF3TW9kZWwobW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldKTtcbiAgICB9XG4gIH1cblxuICBNYXRyaWNlcy5tb2RlbCA9IG0ubXVsdGlwbHkobS50cmFuc2xhdGUobW9kZWxzLnBpcGUuY2VudGVyKSwgbS5zY2FsZShtb2RlbHMucGlwZS5zY2FsZSkpXG4gIGRyYXdNb2RlbChtb2RlbHMucGlwZSlcblxuICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICBnbC5ibGVuZEZ1bmMoZ2wuT05FLCBnbC5PTkUpO1xuXG4gIGdsLmRpc2FibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgZ2wuZGlzYWJsZShnbC5CTEVORCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNhbWVyYSgpIHtcbiAgdmFyIGV5ZSA9IFtDYW1lcmEueCwgQ2FtZXJhLnksIENhbWVyYS56XVxuICB2YXIgdGFyZ2V0ID0gW0NhbWVyYS54ICsgQ2FtZXJhLmxvb2t4LCBDYW1lcmEueSArIENhbWVyYS5sb29reSwgQ2FtZXJhLnogKyBDYW1lcmEubG9va3pdXG4gIE1hdHJpY2VzLnZpZXcgPSBtLmxvb2tBdChleWUsIHRhcmdldCwgdXApO1xuICBNYXRyaWNlcy5wcm9qZWN0aW9uID0gbS5wZXJzcGVjdGl2ZShNYXRoLlBJLzIsIGNhbnZhcy53aWR0aCAvIGNhbnZhcy5oZWlnaHQsIDAuMSwgNTAwKTtcbiAgZ2wudW5pZm9ybU1hdHJpeDRmdihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJ2aWV3XCIpLCBmYWxzZSwgTWF0cmljZXMudmlldyk7XG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwicHJvamVjdGlvblwiKSwgZmFsc2UsIE1hdHJpY2VzLnByb2plY3Rpb24pO1xuXG4gIHZhciBsaWdodFBvcyA9IFtcbiAgICByZXZvbHZlUmFkaXVzICogTWF0aC5jb3ModG9SYWRpYW5zKHdpbmRvdy5yZXZvbHZlQW5nbGUgLSAyNSkpLFxuICAgIDAsXG4gICAgcmV2b2x2ZVJhZGl1cyAqIE1hdGguc2luKHRvUmFkaWFucyh3aW5kb3cucmV2b2x2ZUFuZ2xlIC0gMjUpKVxuICBdXG4gIC8vIHZhciBsaWdodFBvcyA9IHRhcmdldFxuICB2YXIgbGlnaHRQb3NMb2MgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJsaWdodC5wb3NpdGlvblwiKTtcbiAgdmFyIHZpZXdQb3NMb2MgICAgID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidmlld1Bvc1wiKTtcbiAgZ2wudW5pZm9ybTNmKGxpZ2h0UG9zTG9jLCBsaWdodFBvc1swXSwgbGlnaHRQb3NbMV0sIGxpZ2h0UG9zWzJdKTtcbiAgZ2wudW5pZm9ybTNmKHZpZXdQb3NMb2MsIHRhcmdldFswXSwgdGFyZ2V0WzFdLCB0YXJnZXRbMl0pO1xuICB2YXIgbGlnaHRDb2xvciA9IFtdO1xuICBsaWdodENvbG9yWzBdID0gMTtcbiAgbGlnaHRDb2xvclsxXSA9IDE7XG4gIGxpZ2h0Q29sb3JbMl0gPSAxO1xuICB2YXIgZGlmZnVzZUNvbG9yID0gdmVjLm11bHRpcGx5U2NhbGFyKGxpZ2h0Q29sb3IsIDEpOyAvLyBEZWNyZWFzZSB0aGUgaW5mbHVlbmNlXG4gIHZhciBhbWJpZW50Q29sb3IgPSB2ZWMubXVsdGlwbHlTY2FsYXIoZGlmZnVzZUNvbG9yLCAxKTsgLy8gTG93IGluZmx1ZW5jZVxuICBnbC51bmlmb3JtM2YoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibGlnaHQuYW1iaWVudFwiKSwgIGFtYmllbnRDb2xvclswXSwgYW1iaWVudENvbG9yWzFdLCBhbWJpZW50Q29sb3JbMl0pO1xuICBnbC51bmlmb3JtM2YoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibGlnaHQuZGlmZnVzZVwiKSwgIGRpZmZ1c2VDb2xvclswXSwgZGlmZnVzZUNvbG9yWzFdLCBkaWZmdXNlQ29sb3JbMl0pO1xuICBnbC51bmlmb3JtM2YoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibGlnaHQuc3BlY3VsYXJcIiksIDEuMCwgMS4wLCAxLjApOyAgXG59XG5cbmZ1bmN0aW9uIGRldGVjdENvbGxpc2lvbnMgKCkge1xuICB2YXIgYW5nbGUgPSAwO1xuICB2YXIgaSA9IDA7XG4gIGZvcihpID0gMDsgaSA8IG51bU9ic3RhY2xlczsgaSsrKSB7XG4gICAgYW5nbGUgPSBNYXRoLmF0YW4obW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnNjYWxlWzFdIC8gbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnNjYWxlWzBdKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgaWYoKHdpbmRvdy5vY3RBbmdsZSAlIDE4MCA+PSAobW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMiAlIDE4MCAtIGFuZ2xlKSAmJlxuICAgIHdpbmRvdy5vY3RBbmdsZSAlIDE4MCA8PSAobW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMiAlIDE4MCArIGFuZ2xlKSkgJiZcbiAgICAoKHdpbmRvdy5yZXZvbHZlQW5nbGUgJSAzNjAgPD0gbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMSArIDQpICYmIHdpbmRvdy5yZXZvbHZlQW5nbGUgJSAzNjAgPj0gbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMSAtIDQpXG4gICAgKSB7XG4gICAgICB3aW5kb3cucGxheUZsYWcgPSAwO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWVPdmVyQ29udGFpbmVyJykuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlQ29udGFpbmVyJykuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2FtZU92ZXInKS5pbm5lclRleHQgPSBcIkdBTUUgT1ZFUiBcXG5cXG4gU0NPUkU6IFwiICsgd2luZG93LnNjb3JlICsgXCJcXG5cXG5cIiArIFwiTEVWRUw6IFwiICsgd2luZG93LmxldmVsO1xuXG4gICAgfVxuICB9XG4gIGlmKHdpbmRvdy5sZXZlbCA+PSAyKSB7XG4gICAgZm9yKGkgPSAwOyBpIDwgbnVtT2JzdGFjbGVzMjsgaSsrKSB7XG5cbiAgICAgIGFuZ2xlID0gTWF0aC5hdGFuKG1vZGVsc1tcIm9ic3RhY2xlQmlnXCIgKyBpXS5zY2FsZVsxXSAvIG1vZGVsc1tcIm9ic3RhY2xlQmlnXCIgKyBpXS5zY2FsZVswXSkgKiAxODAgLyBNYXRoLlBJO1xuICAgICAgaWYoKHdpbmRvdy5vY3RBbmdsZSAlIDE4MCA+PSAobW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLnJvdGF0ZUFuZ2xlMiAlIDE4MCAtIGFuZ2xlKSAmJlxuICAgIHdpbmRvdy5vY3RBbmdsZSAlIDE4MCA8PSAobW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLnJvdGF0ZUFuZ2xlMiAlIDE4MCArIGFuZ2xlKSkgJiZcbiAgICAoKHdpbmRvdy5yZXZvbHZlQW5nbGUgJSAzNjAgPD0gbW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLnJvdGF0ZUFuZ2xlMSArIDQpICYmIHdpbmRvdy5yZXZvbHZlQW5nbGUgJSAzNjAgPj0gbW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLnJvdGF0ZUFuZ2xlMSAtIDQpXG4gICAgICApIHtcbiAgICAgICAgd2luZG93LnBsYXlGbGFnID0gMDtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWVPdmVyQ29udGFpbmVyJykuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NvcmVDb250YWluZXInKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWVPdmVyJykuaW5uZXJUZXh0ID0gXCJHQU1FIE9WRVIgXFxuXFxuIFNDT1JFOiBcIiArIHdpbmRvdy5zY29yZSArIFwiXFxuXFxuXCIgKyBcIkxFVkVMOiBcIiArIHdpbmRvdy5sZXZlbDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vIEhUTUwgaGVscGVyIGZ1bmN0aW9ucyAvLy8vLy8vLy8vLy8vLy8vXG4kKFwiI3dlbGNvbWVDb250YWluZXJcIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gIHRoaXMuc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xufSk7XG5cbiQoXCIjcGxheVwiKS5jbGljayhmdW5jdGlvbigpIHtcbiAgd2luZG93LnBsYXlGbGFnID0gMTtcbn0pO1xuIiwidmFyIHZlYyA9IHJlcXVpcmUoJy4vdmVjdG9yJylcblxuLy8gMCAxIDIgMyAgICAgICAgMCAxIDIgM1xuLy8gNCA1IDYgNyAgICAgICAgNCA1IDYgN1xuLy8gOCA5IDEwIDExICAgICAgOCA5IDEwIDExXG4vLyAxMiAxMyAxNCAxNSAgICAxMiAxMyAxNCAxNVxuZnVuY3Rpb24gbWF0cml4TXVsdGlwbHkobWF0MiwgbWF0MSlcbntcbiAgcmV0dXJuIFtcbiAgICBtYXQxWzBdKm1hdDJbMF0rbWF0MVsxXSptYXQyWzRdK21hdDFbMl0qbWF0Mls4XSttYXQxWzNdKm1hdDJbMTJdLFxuICAgIG1hdDFbMF0qbWF0MlsxXSttYXQxWzFdKm1hdDJbNV0rbWF0MVsyXSptYXQyWzldK21hdDFbM10qbWF0MlsxM10sXG4gICAgbWF0MVswXSptYXQyWzJdK21hdDFbMV0qbWF0Mls2XSttYXQxWzJdKm1hdDJbMTBdK21hdDFbM10qbWF0MlsxNF0sXG4gICAgbWF0MVswXSptYXQyWzNdK21hdDFbMV0qbWF0Mls3XSttYXQxWzJdKm1hdDJbMTFdK21hdDFbM10qbWF0MlsxNV0sXG4gICAgbWF0MVs0XSptYXQyWzBdK21hdDFbNV0qbWF0Mls0XSttYXQxWzZdKm1hdDJbOF0rbWF0MVs3XSptYXQyWzEyXSxcbiAgICBtYXQxWzRdKm1hdDJbMV0rbWF0MVs1XSptYXQyWzVdK21hdDFbNl0qbWF0Mls5XSttYXQxWzddKm1hdDJbMTNdLFxuICAgIG1hdDFbNF0qbWF0MlsyXSttYXQxWzVdKm1hdDJbNl0rbWF0MVs2XSptYXQyWzEwXSttYXQxWzddKm1hdDJbMTRdLFxuICAgIG1hdDFbNF0qbWF0MlszXSttYXQxWzVdKm1hdDJbN10rbWF0MVs2XSptYXQyWzExXSttYXQxWzddKm1hdDJbMTVdLFxuICAgIG1hdDFbOF0qbWF0MlswXSttYXQxWzldKm1hdDJbNF0rbWF0MVsxMF0qbWF0Mls4XSttYXQxWzExXSptYXQyWzEyXSxcbiAgICBtYXQxWzhdKm1hdDJbMV0rbWF0MVs5XSptYXQyWzVdK21hdDFbMTBdKm1hdDJbOV0rbWF0MVsxMV0qbWF0MlsxM10sXG4gICAgbWF0MVs4XSptYXQyWzJdK21hdDFbOV0qbWF0Mls2XSttYXQxWzEwXSptYXQyWzEwXSttYXQxWzExXSptYXQyWzE0XSxcbiAgICBtYXQxWzhdKm1hdDJbM10rbWF0MVs5XSptYXQyWzddK21hdDFbMTBdKm1hdDJbMTFdK21hdDFbMTFdKm1hdDJbMTVdLFxuICAgIG1hdDFbMTJdKm1hdDJbMF0rbWF0MVsxM10qbWF0Mls0XSttYXQxWzE0XSptYXQyWzhdK21hdDFbMTVdKm1hdDJbMTJdLFxuICAgIG1hdDFbMTJdKm1hdDJbMV0rbWF0MVsxM10qbWF0Mls1XSttYXQxWzE0XSptYXQyWzldK21hdDFbMTVdKm1hdDJbMTNdLFxuICAgIG1hdDFbMTJdKm1hdDJbMl0rbWF0MVsxM10qbWF0Mls2XSttYXQxWzE0XSptYXQyWzEwXSttYXQxWzE1XSptYXQyWzE0XSxcbiAgICBtYXQxWzEyXSptYXQyWzNdK21hdDFbMTNdKm1hdDJbN10rbWF0MVsxNF0qbWF0MlsxMV0rbWF0MVsxNV0qbWF0MlsxNV1cbiAgXTtcbn1cblxuZnVuY3Rpb24gbWF0cml4TXVsdGlwbHk0eDEobWF0MSwgbWF0MilcbntcbiAgcmV0dXJuIFtcbiAgICBtYXQxWzBdKm1hdDJbMF0rbWF0MVsxXSptYXQyWzFdK21hdDFbMl0qbWF0MlsyXSttYXQxWzNdKm1hdDFbM10sXG4gICAgbWF0MVs0XSptYXQyWzBdK21hdDFbNV0qbWF0MlsxXSttYXQxWzZdKm1hdDJbMl0rbWF0MVs3XSptYXQxWzNdLFxuICAgIG1hdDFbOF0qbWF0MlswXSttYXQxWzldKm1hdDJbMV0rbWF0MVsxMF0qbWF0MlsyXSttYXQxWzExXSptYXQxWzNdLFxuICAgIG1hdDFbMTJdKm1hdDJbMF0rbWF0MVsxM10qbWF0MlsxXSttYXQxWzE0XSptYXQyWzJdK21hdDFbMTVdKm1hdDFbM11cbiAgXTtcbn1cblxuZnVuY3Rpb24gbXVsdGlwbHkobTEsIG0yKVxue1xuICBpZiAobTIubGVuZ3RoID09IDQpIHJldHVybiBtYXRyaXhNdWx0aXBseTR4MShtMSwgbTIpXG4gIGVsc2UgcmV0dXJuIG1hdHJpeE11bHRpcGx5KG0xLCBtMilcbn1cblxuZnVuY3Rpb24gaW52ZXJzZShhKVxue1xuICB2YXIgczAgPSBhWzBdICogYVs1XSAtIGFbNF0gKiBhWzFdO1xuICB2YXIgczEgPSBhWzBdICogYVs2XSAtIGFbNF0gKiBhWzJdO1xuICB2YXIgczIgPSBhWzBdICogYVs3XSAtIGFbNF0gKiBhWzNdO1xuICB2YXIgczMgPSBhWzFdICogYVs2XSAtIGFbNV0gKiBhWzJdO1xuICB2YXIgczQgPSBhWzFdICogYVs3XSAtIGFbNV0gKiBhWzNdO1xuICB2YXIgczUgPSBhWzJdICogYVs3XSAtIGFbNl0gKiBhWzNdO1xuXG4gIHZhciBjNSA9IGFbMTBdICogYVsxNV0gLSBhWzE0XSAqIGFbMTFdO1xuICB2YXIgYzQgPSBhWzldICogYVsxNV0gLSBhWzEzXSAqIGFbMTFdO1xuICB2YXIgYzMgPSBhWzldICogYVsxNF0gLSBhWzEzXSAqIGFbMTBdO1xuICB2YXIgYzIgPSBhWzhdICogYVsxNV0gLSBhWzEyXSAqIGFbMTFdO1xuICB2YXIgYzEgPSBhWzhdICogYVsxNF0gLSBhWzEyXSAqIGFbMTBdO1xuICB2YXIgYzAgPSBhWzhdICogYVsxM10gLSBhWzEyXSAqIGFbOV07XG5cbiAgLy9jb25zb2xlLmxvZyhjNSxzNSxzNCk7XG5cbiAgLy8gU2hvdWxkIGNoZWNrIGZvciAwIGRldGVybWluYW50XG4gIHZhciBpbnZkZXQgPSAxLjAgLyAoczAgKiBjNSAtIHMxICogYzQgKyBzMiAqIGMzICsgczMgKiBjMiAtIHM0ICogYzEgKyBzNSAqIGMwKTtcblxuICB2YXIgYiA9IFtbXSxbXSxbXSxbXV07XG5cbiAgYlswXSA9ICggYVs1XSAqIGM1IC0gYVs2XSAqIGM0ICsgYVs3XSAqIGMzKSAqIGludmRldDtcbiAgYlsxXSA9ICgtYVsxXSAqIGM1ICsgYVsyXSAqIGM0IC0gYVszXSAqIGMzKSAqIGludmRldDtcbiAgYlsyXSA9ICggYVsxM10gKiBzNSAtIGFbMTRdICogczQgKyBhWzE1XSAqIHMzKSAqIGludmRldDtcbiAgYlszXSA9ICgtYVs5XSAqIHM1ICsgYVsxMF0gKiBzNCAtIGFbMTFdICogczMpICogaW52ZGV0O1xuXG4gIGJbNF0gPSAoLWFbNF0gKiBjNSArIGFbNl0gKiBjMiAtIGFbN10gKiBjMSkgKiBpbnZkZXQ7XG4gIGJbNV0gPSAoIGFbMF0gKiBjNSAtIGFbMl0gKiBjMiArIGFbM10gKiBjMSkgKiBpbnZkZXQ7XG4gIGJbNl0gPSAoLWFbMTJdICogczUgKyBhWzE0XSAqIHMyIC0gYVsxNV0gKiBzMSkgKiBpbnZkZXQ7XG4gIGJbN10gPSAoIGFbOF0gKiBzNSAtIGFbMTBdICogczIgKyBhWzExXSAqIHMxKSAqIGludmRldDtcblxuICBiWzhdID0gKCBhWzRdICogYzQgLSBhWzVdICogYzIgKyBhWzddICogYzApICogaW52ZGV0O1xuICBiWzldID0gKC1hWzBdICogYzQgKyBhWzFdICogYzIgLSBhWzNdICogYzApICogaW52ZGV0O1xuICBiWzEwXSA9ICggYVsxMl0gKiBzNCAtIGFbMTNdICogczIgKyBhWzE1XSAqIHMwKSAqIGludmRldDtcbiAgYlsxMV0gPSAoLWFbOF0gKiBzNCArIGFbOV0gKiBzMiAtIGFbMTFdICogczApICogaW52ZGV0O1xuXG4gIGJbMTJdID0gKC1hWzRdICogYzMgKyBhWzVdICogYzEgLSBhWzZdICogYzApICogaW52ZGV0O1xuICBiWzEzXSA9ICggYVswXSAqIGMzIC0gYVsxXSAqIGMxICsgYVsyXSAqIGMwKSAqIGludmRldDtcbiAgYlsxNF0gPSAoLWFbMTJdICogczMgKyBhWzEzXSAqIHMxIC0gYVsxNF0gKiBzMCkgKiBpbnZkZXQ7XG4gIGJbMTVdID0gKCBhWzhdICogczMgLSBhWzldICogczEgKyBhWzEwXSAqIHMwKSAqIGludmRldDtcblxuICByZXR1cm4gYjtcbn1cblxuZnVuY3Rpb24gcGVyc3BlY3RpdmUoZmllbGRPZlZpZXdJblJhZGlhbnMsIGFzcGVjdCwgbmVhciwgZmFyKVxue1xuICB2YXIgZiA9IE1hdGgudGFuKE1hdGguUEkgKiAwLjUgLSAwLjUgKiBmaWVsZE9mVmlld0luUmFkaWFucyk7XG4gIHZhciByYW5nZUludiA9IDEuMCAvIChuZWFyIC0gZmFyKTtcblxuICByZXR1cm4gW1xuICAgIGYgLyBhc3BlY3QsIDAsIDAsIDAsXG4gICAgMCwgZiwgMCwgMCxcbiAgICAwLCAwLCAobmVhciArIGZhcikgKiByYW5nZUludiwgLTEsXG4gICAgMCwgMCwgbmVhciAqIGZhciAqIHJhbmdlSW52ICogMiwgMFxuICBdO1xufVxuXG5mdW5jdGlvbiBtYWtlWlRvV01hdHJpeChmdWRnZUZhY3RvcilcbntcbiAgcmV0dXJuIFtcbiAgICAxLCAwLCAwLCAwLFxuICAgIDAsIDEsIDAsIDAsXG4gICAgMCwgMCwgMSwgZnVkZ2VGYWN0b3IsXG4gICAgMCwgMCwgMCwgMSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gdHJhbnNsYXRlKHR4LCB0eSwgdHopXG57XG4gIGlmICh0eXBlb2YgdHggIT0gJ251bWJlcicpXG4gIHtcbiAgICBsZXQgb2xkID0gdHhcbiAgICB0eCA9IG9sZFswXVxuICAgIHR5ID0gb2xkWzFdXG4gICAgdHogPSBvbGRbMl1cbiAgfVxuICByZXR1cm4gW1xuICAgIDEsICAwLCAgMCwgIDAsXG4gICAgMCwgIDEsICAwLCAgMCxcbiAgICAwLCAgMCwgIDEsICAwLFxuICAgIHR4LCB0eSwgdHosIDFcbiAgXTtcbn1cblxuZnVuY3Rpb24gcm90YXRlWChhbmdsZUluUmFkaWFucylcbntcbiAgdmFyIGMgPSBNYXRoLmNvcyhhbmdsZUluUmFkaWFucyk7XG4gIHZhciBzID0gTWF0aC5zaW4oYW5nbGVJblJhZGlhbnMpO1xuXG4gIHJldHVybiBbXG4gICAgMSwgMCwgMCwgMCxcbiAgICAwLCBjLCBzLCAwLFxuICAgIDAsIC1zLCBjLCAwLFxuICAgIDAsIDAsIDAsIDFcbiAgXTtcbn1cblxuZnVuY3Rpb24gcm90YXRlWShhbmdsZUluUmFkaWFucylcbntcbiAgdmFyIGMgPSBNYXRoLmNvcyhhbmdsZUluUmFkaWFucyk7XG4gIHZhciBzID0gTWF0aC5zaW4oYW5nbGVJblJhZGlhbnMpO1xuXG4gIHJldHVybiBbXG4gICAgYywgMCwgLXMsIDAsXG4gICAgMCwgMSwgMCwgMCxcbiAgICBzLCAwLCBjLCAwLFxuICAgIDAsIDAsIDAsIDFcbiAgXTtcbn1cblxuZnVuY3Rpb24gcm90YXRlWihhbmdsZUluUmFkaWFucykge1xuICB2YXIgYyA9IE1hdGguY29zKGFuZ2xlSW5SYWRpYW5zKTtcbiAgdmFyIHMgPSBNYXRoLnNpbihhbmdsZUluUmFkaWFucyk7XG5cbiAgcmV0dXJuIFtcbiAgICBjLCBzLCAwLCAwLFxuICAgIC1zLCBjLCAwLCAwLFxuICAgIDAsIDAsIDEsIDAsXG4gICAgMCwgMCwgMCwgMSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gc2NhbGUoc3gsIHN5LCBzeikge1xuICBpZiAodHlwZW9mIHN4ICE9ICdudW1iZXInKSB7XG4gICAgbGV0IG9sZCA9IHN4XG4gICAgc3ggPSBvbGRbMF1cbiAgICBzeSA9IG9sZFsxXVxuICAgIHN6ID0gb2xkWzJdXG4gIH1cbiAgcmV0dXJuIFtcbiAgICBzeCwgMCwgIDAsICAwLFxuICAgIDAsIHN5LCAgMCwgIDAsXG4gICAgMCwgIDAsIHN6LCAgMCxcbiAgICAwLCAgMCwgIDAsICAxLFxuICBdO1xufVxuXG5mdW5jdGlvbiBsb29rQXQoZXllLCB0YXJnZXQsIHVwKXtcbiAgdmFyIGYgPSB2ZWMubm9ybWFsaXplKHZlYy5zdWJ0cmFjdCh0YXJnZXQsIGV5ZSkpO1xuICB2YXIgcyA9IHZlYy5ub3JtYWxpemUodmVjLmNyb3NzKGYsIHVwKSk7XG4gIHZhciB1ID0gdmVjLmNyb3NzKHMsIGYpO1xuXG4gIHZhciByZXN1bHQgPSBpZGVudGl0eSgpO1xuICByZXN1bHRbNCowICsgMF0gPSBzWzBdO1xuICByZXN1bHRbNCoxICsgMF0gPSBzWzFdO1xuICByZXN1bHRbNCoyICsgMF0gPSBzWzJdO1xuICByZXN1bHRbNCowICsgMV0gPSB1WzBdO1xuICByZXN1bHRbNCoxICsgMV0gPSB1WzFdO1xuICByZXN1bHRbNCoyICsgMV0gPSB1WzJdO1xuICByZXN1bHRbNCowICsgMl0gPS1mWzBdO1xuICByZXN1bHRbNCoxICsgMl0gPS1mWzFdO1xuICByZXN1bHRbNCoyICsgMl0gPS1mWzJdO1xuICByZXN1bHRbNCozICsgMF0gPS12ZWMuZG90KHMsIGV5ZSk7XG4gIHJlc3VsdFs0KjMgKyAxXSA9LXZlYy5kb3QodSwgZXllKTtcbiAgcmVzdWx0WzQqMyArIDJdID0gdmVjLmRvdChmLCBleWUpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpZGVudGl0eSgpIHtcbiAgcmV0dXJuIHNjYWxlKDEsIDEsIDEpXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtdWx0aXBseSxcbiAgaW52ZXJzZSxcbiAgaWRlbnRpdHksXG5cbiAgcGVyc3BlY3RpdmUsXG4gIG1ha2VaVG9XTWF0cml4LFxuICBsb29rQXQsXG5cbiAgdHJhbnNsYXRlLFxuICByb3RhdGVYLCByb3RhdGVZLCByb3RhdGVaLFxuICBzY2FsZSxcbn1cbiIsInZhciBtID0gcmVxdWlyZSgnLi9tYXRyaXgnKVxuXG5mdW5jdGlvbiBvcGVuRmlsZShuYW1lLCBmaWxlbmFtZSl7XG4gIHZhciBkYXRhc3RyaW5nO1xuICAkLmFqYXgoe1xuICAgIHVybCA6IGZpbGVuYW1lICsgJy5vYmonLFxuICAgIGRhdGFUeXBlOiBcInRleHRcIixcbiAgICBzdWNjZXNzIDogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGRhdGFzdHJpbmcgPSBkYXRhO1xuICAgICAgJC5hamF4KHtcbiAgICAgICAgdXJsIDogZmlsZW5hbWUgKyAnLm10bCcsXG4gICAgICAgIGRhdGFUeXBlOiBcInRleHRcIixcbiAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uIChtdGxzdHJpbmcpIHtcbiAgICAgICAgICBjcmVhdGVNb2RlbChuYW1lLCBkYXRhc3RyaW5nLCBtdGxzdHJpbmcpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1ha2VNb2RlbChuYW1lLCBmaWxlbmFtZSwgY2VudGVyID0gWzAsIDAsIDBdLCBzY2FsZSA9IFsxLCAxLCAxXSxcbiAgcm90YXRlQW5nbGUxID0gMCwgcm90YXRlQW5nbGUyID0gMCwgcm90YXRpb25TcGVlZCkge1xuICBtb2RlbHNbbmFtZV0gPSB7bmFtZSwgY2VudGVyLCBzY2FsZSwgcm90YXRlQW5nbGUxLCByb3RhdGVBbmdsZTIsIHJvdGF0aW9uU3BlZWR9O1xuICBvcGVuRmlsZShuYW1lLCBmaWxlbmFtZSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlTXRsKG10bHN0cmluZykge1xuICB2YXIgbXRsbGliID0ge31cbiAgdmFyIGxpbmVzID0gbXRsc3RyaW5nLnNwbGl0KCdcXG4nKTtcbiAgdmFyIGN1cm10bCA9ICcnXG4gIGZvciAodmFyIGo9MDsgajxsaW5lcy5sZW5ndGg7IGorKykge1xuICAgIHZhciB3b3JkcyA9IGxpbmVzW2pdLnNwbGl0KCcgJyk7XG4gICAgaWYgKHdvcmRzWzBdID09ICduZXdtdGwnKSB7XG4gICAgICBjdXJtdGwgPSB3b3Jkc1sxXVxuICAgICAgbXRsbGliW2N1cm10bF0gPSB7fVxuICAgIH0gZWxzZSBpZiAod29yZHNbMF0gPT0gJ0tkJykge1xuICAgICAgbXRsbGliW2N1cm10bF0uZGlmZnVzZSA9IFtcbiAgICAgICAgcGFyc2VGbG9hdCh3b3Jkc1sxXSksXG4gICAgICAgIHBhcnNlRmxvYXQod29yZHNbMl0pLFxuICAgICAgICBwYXJzZUZsb2F0KHdvcmRzWzNdKSxcbiAgICAgIF1cbiAgICB9IGVsc2UgaWYgKHdvcmRzWzBdID09ICdLcycpIHtcbiAgICAgIG10bGxpYltjdXJtdGxdLnNwZWN1bGFyID0gW1xuICAgICAgICBwYXJzZUZsb2F0KHdvcmRzWzFdKSxcbiAgICAgICAgcGFyc2VGbG9hdCh3b3Jkc1syXSksXG4gICAgICAgIHBhcnNlRmxvYXQod29yZHNbM10pLFxuICAgICAgXVxuICAgIH0gZWxzZSBpZiAod29yZHNbMF0gPT0gJ0thJykge1xuICAgICAgbXRsbGliW2N1cm10bF0uYW1iaWVudCA9IFtcbiAgICAgICAgcGFyc2VGbG9hdCh3b3Jkc1sxXSksXG4gICAgICAgIHBhcnNlRmxvYXQod29yZHNbMl0pLFxuICAgICAgICBwYXJzZUZsb2F0KHdvcmRzWzNdKSxcbiAgICAgIF1cbiAgICB9IGVsc2UgaWYgKHdvcmRzWzBdID09ICdOcycpIHtcbiAgICAgIG10bGxpYltjdXJtdGxdLnNoaW5pbmVzcyA9IHBhcnNlRmxvYXQod29yZHNbMV0pXG4gICAgfSBlbHNlIGlmICh3b3Jkc1swXSA9PSAnbWFwX0tkJykge1xuICAgICAgbG9hZFRleHR1cmUod29yZHNbMV0sIG10bGxpYltjdXJtdGxdKVxuICAgIH1cbiAgfVxuICByZXR1cm4gbXRsbGliXG59XG5cbmZ1bmN0aW9uIGhhbmRsZUxvYWRlZFRleHR1cmUodGV4dHVyZSkge1xuICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0cnVlKTtcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XG4gIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgdGV4dHVyZS5pbWFnZSk7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbC5MSU5FQVIpO1xuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSX01JUE1BUF9ORUFSRVNUKTtcbiAgZ2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV8yRCk7XG5cbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGxvYWRUZXh0dXJlKHNyYywgbWF0ZXJpYWwpIHtcbiAgdmFyIHRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gIHRleHR1cmUuaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgdGV4dHVyZS5pbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaGFuZGxlTG9hZGVkVGV4dHVyZSh0ZXh0dXJlKVxuICAgIG1hdGVyaWFsLnRleHR1cmUgPSB0ZXh0dXJlXG4gIH1cbiAgdGV4dHVyZS5pbWFnZS5zcmMgPSBzcmM7XG4gIHJldHVybiB0ZXh0dXJlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVNb2RlbChuYW1lLCBmaWxlZGF0YSwgbXRsc3RyaW5nKSAvL0NyZWF0ZSBvYmplY3QgZnJvbSBibGVuZGVyXG57XG4gIHZhciBtb2RlbCA9IG1vZGVsc1tuYW1lXTtcbiAgdmFyIG10bGxpYiA9IHBhcnNlTXRsKG10bHN0cmluZylcbiAgdmFyIHZlcnRleF9idWZmZXJfZGF0YSA9IFtdO1xuICB2YXIgcG9pbnRzID0gW107XG4gIHZhciBtaW5YID0gMTAwMDAwMFxuICB2YXIgbWF4WCA9IC0xMDAwMDAwXG4gIHZhciBtaW5ZID0gMTAwMDAwMFxuICB2YXIgbWF4WSA9IC0xMDAwMDAwXG4gIHZhciBtaW5aID0gMTAwMDAwMFxuICB2YXIgbWF4WiA9IC0xMDAwMDAwXG5cbiAgdmFyIGludmVydE5vcm1hbHMgPSBmYWxzZTtcbiAgdmFyIG5vcm1hbHMgPSBbXTtcbiAgdmFyIG5vcm1hbF9idWZmZXJfZGF0YSA9IFtdO1xuXG4gIHZhciB0ZXh0dXJlcyA9IFtdO1xuICB2YXIgdGV4dHVyZV9idWZmZXJfZGF0YSA9IFtdO1xuXG4gIG1vZGVsLnZhb3MgPSBbXTtcblxuICB2YXIgbGluZXMgPSBmaWxlZGF0YS5zcGxpdCgnXFxuJyk7XG4gIGxpbmVzID0gbGluZXMubWFwKHMgPT4gcy50cmltKCkpXG4gIGxpbmVzLnB1c2goJ3VzZW10bCcpXG4gIGZvciAodmFyIGo9MDsgajxsaW5lcy5sZW5ndGg7IGorKyl7XG4gICAgdmFyIHdvcmRzID0gbGluZXNbal0uc3BsaXQoJyAnKTtcbiAgICBpZih3b3Jkc1swXSA9PSBcInZcIil7XG4gICAgICB2YXIgY3VyX3BvaW50ID0ge307XG4gICAgICBjdXJfcG9pbnRbJ3gnXT1wYXJzZUZsb2F0KHdvcmRzWzFdKTtcbiAgICAgIGlmKGN1cl9wb2ludFsneCddPm1heFgpe1xuICAgICAgICBtYXhYID0gY3VyX3BvaW50Wyd4J11cbiAgICAgIH1cbiAgICAgIGlmKGN1cl9wb2ludFsneCddPG1pblgpe1xuICAgICAgICBtaW5YID0gY3VyX3BvaW50Wyd4J11cbiAgICAgIH1cbiAgICAgIGN1cl9wb2ludFsneSddPXBhcnNlRmxvYXQod29yZHNbMl0pO1xuICAgICAgaWYoY3VyX3BvaW50Wyd5J10+bWF4WSl7XG4gICAgICAgIG1heFkgPSBjdXJfcG9pbnRbJ3knXVxuICAgICAgfVxuICAgICAgaWYoY3VyX3BvaW50Wyd5J108bWluWSl7XG4gICAgICAgIG1pblkgPSBjdXJfcG9pbnRbJ3knXVxuICAgICAgfVxuICAgICAgY3VyX3BvaW50Wyd6J109cGFyc2VGbG9hdCh3b3Jkc1szXSk7XG4gICAgICBpZihjdXJfcG9pbnRbJ3onXT5tYXhaKXtcbiAgICAgICAgbWF4WiA9IGN1cl9wb2ludFsneiddXG4gICAgICB9XG4gICAgICBpZihjdXJfcG9pbnRbJ3onXTxtaW5aKXtcbiAgICAgICAgbWluWiA9IGN1cl9wb2ludFsneiddXG4gICAgICB9XG4gICAgICAvL2NvbnNvbGUubG9nKHdvcmRzKTtcbiAgICAgIHBvaW50cy5wdXNoKGN1cl9wb2ludCk7XG4gICAgfSBlbHNlIGlmICh3b3Jkc1swXSA9PSBcInZuXCIpIHtcbiAgICAgIGxldCBjdXJfcG9pbnQgPSB7fTtcbiAgICAgIGN1cl9wb2ludFsneCddPXBhcnNlRmxvYXQod29yZHNbMV0pO1xuICAgICAgY3VyX3BvaW50Wyd5J109cGFyc2VGbG9hdCh3b3Jkc1syXSk7XG4gICAgICBjdXJfcG9pbnRbJ3onXT1wYXJzZUZsb2F0KHdvcmRzWzNdKTtcbiAgICAgIC8vY29uc29sZS5sb2cod29yZHMpO1xuICAgICAgbm9ybWFscy5wdXNoKGN1cl9wb2ludCk7XG4gICAgfSBlbHNlIGlmICh3b3Jkc1swXSA9PSBcInZ0XCIpIHtcbiAgICAgIGxldCBjdXJfcG9pbnQgPSB7fTtcbiAgICAgIGN1cl9wb2ludC5zID0gcGFyc2VGbG9hdCh3b3Jkc1sxXSk7XG4gICAgICBjdXJfcG9pbnQudCA9IHBhcnNlRmxvYXQod29yZHNbMl0pO1xuICAgICAgdGV4dHVyZXMucHVzaChjdXJfcG9pbnQpO1xuICAgIH1cbiAgfVxuICBtb2RlbC5taW5YID0gbWluWFxuICBtb2RlbC5tYXhYID0gbWF4WFxuICBtb2RlbC5taW5ZID0gbWluWVxuICBtb2RlbC5tYXhZID0gbWF4WVxuICBtb2RlbC5taW5aID0gbWluWlxuICBtb2RlbC5tYXhaID0gbWF4WlxuICAvL2NvbnNvbGUubG9nKHBvaW50cyk7XG4gIC8vIGxldCBsaW5lcyA9IGZpbGVkYXRhLnNwbGl0KCdcXG4nKTtcbiAgdmFyIGN1cm10bCA9ICcnXG4gIGZvciAodmFyIGpqPTA7IGpqPGxpbmVzLmxlbmd0aDsgamorKyl7XG4gICAgbGV0IHdvcmRzID0gbGluZXNbampdLnNwbGl0KCcgJyk7XG4gICAgaWYod29yZHNbMF0gPT0gXCJmXCIpIHtcbiAgICAgIGZvciAobGV0IHdjID0gMTsgd2MgPCA0OyB3YysrKSB7XG4gICAgICAgIGxldCB2eGRhdGEgPSB3b3Jkc1t3Y10uc3BsaXQoJy8nKVxuICAgICAgICBsZXQgcCA9IHBhcnNlSW50KHZ4ZGF0YVswXSkgLSAxXG4gICAgICAgIGxldCB0ID0gcGFyc2VJbnQodnhkYXRhWzFdKSAtIDFcbiAgICAgICAgbGV0IG4gPSBwYXJzZUludCh2eGRhdGFbMl0pIC0gMVxuICAgICAgICB2ZXJ0ZXhfYnVmZmVyX2RhdGEucHVzaChwb2ludHNbcF0ueClcbiAgICAgICAgdmVydGV4X2J1ZmZlcl9kYXRhLnB1c2gocG9pbnRzW3BdLnkpXG4gICAgICAgIHZlcnRleF9idWZmZXJfZGF0YS5wdXNoKHBvaW50c1twXS56KVxuXG4gICAgICAgIGlmICghaXNOYU4odCkpIHtcbiAgICAgICAgICB0ZXh0dXJlX2J1ZmZlcl9kYXRhLnB1c2godGV4dHVyZXNbdF0ucylcbiAgICAgICAgICB0ZXh0dXJlX2J1ZmZlcl9kYXRhLnB1c2godGV4dHVyZXNbdF0udClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbnZlcnROb3JtYWxzKSB7XG4gICAgICAgICAgbm9ybWFsX2J1ZmZlcl9kYXRhLnB1c2goLW5vcm1hbHNbbl0ueClcbiAgICAgICAgICBub3JtYWxfYnVmZmVyX2RhdGEucHVzaCgtbm9ybWFsc1tuXS55KVxuICAgICAgICAgIG5vcm1hbF9idWZmZXJfZGF0YS5wdXNoKC1ub3JtYWxzW25dLnopXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbm9ybWFsX2J1ZmZlcl9kYXRhLnB1c2gobm9ybWFsc1tuXS54KVxuICAgICAgICAgIG5vcm1hbF9idWZmZXJfZGF0YS5wdXNoKG5vcm1hbHNbbl0ueSlcbiAgICAgICAgICBub3JtYWxfYnVmZmVyX2RhdGEucHVzaChub3JtYWxzW25dLnopXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHdvcmRzWzBdID09ICd1c2VtdGwnKSB7XG4gICAgICBsZXQgdmFvID0ge31cbiAgICAgIHZhby5udW1WZXJ0ZXggPSB2ZXJ0ZXhfYnVmZmVyX2RhdGEubGVuZ3RoIC8gMztcbiAgICAgIGlmICh2YW8ubnVtVmVydGV4ICE9IDApIHtcbiAgICAgICAgdmFyIHZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdmVydGV4QnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodmVydGV4X2J1ZmZlcl9kYXRhKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICB2YW8udmVydGV4QnVmZmVyID0gdmVydGV4QnVmZmVyXG5cbiAgICAgICAgdmFyIG5vcm1hbEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgbm9ybWFsQnVmZmVyKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkobm9ybWFsX2J1ZmZlcl9kYXRhKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICB2YW8ubm9ybWFsQnVmZmVyID0gbm9ybWFsQnVmZmVyXG5cbiAgICAgICAgdmFyIHRleHR1cmVCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRleHR1cmVCdWZmZXIpO1xuICAgICAgICBpZiAodGV4dHVyZV9idWZmZXJfZGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodGV4dHVyZV9idWZmZXJfZGF0YSksIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgICAgICB2YW8uaXNUZXh0dXJlZCA9IHRydWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDIqdmFvLm51bVZlcnRleDsgaSsrKSB0ZXh0dXJlX2J1ZmZlcl9kYXRhLnB1c2goMClcbiAgICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlX2J1ZmZlcl9kYXRhKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICAgIHZhby5pc1RleHR1cmVkID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICB2YW8udGV4dHVyZUJ1ZmZlciA9IHRleHR1cmVCdWZmZXJcblxuICAgICAgICB2YW8ubWF0ZXJpYWwgPSBtdGxsaWJbY3VybXRsXVxuXG4gICAgICAgIG1vZGVsLnZhb3MucHVzaCh2YW8pXG4gICAgICAgIHZlcnRleF9idWZmZXJfZGF0YSA9IFtdXG4gICAgICAgIG5vcm1hbF9idWZmZXJfZGF0YSA9IFtdXG4gICAgICAgIHRleHR1cmVfYnVmZmVyX2RhdGEgPSBbXVxuICAgICAgfSBlbHNlIGlmICh3b3Jkc1swXSA9PSAnaW52ZXJ0Tm9ybWFscycpIHtcbiAgICAgICAgaW52ZXJ0Tm9ybWFscyA9ICFpbnZlcnROb3JtYWxzXG4gICAgICB9XG4gICAgICBjdXJtdGwgPSB3b3Jkc1sxXVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkcmF3TW9kZWwgKG1vZGVsKSB7XG4gIGlmICghbW9kZWwudmFvcykgcmV0dXJuXG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibW9kZWxcIiksIGZhbHNlLCBNYXRyaWNlcy5tb2RlbCk7XG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibW9kZWxJbnZcIiksIGZhbHNlLCBtLmludmVyc2UoTWF0cmljZXMubW9kZWwpKTtcblxuICBtb2RlbC52YW9zLm1hcChkcmF3VkFPKVxufVxuXG5mdW5jdGlvbiBkcmF3TGlnaHQobW9kZWwpIHtcbiAgZ2wudW5pZm9ybTFpKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcImlzTGlnaHRcIiksIDEpO1xuICBkcmF3TW9kZWwobW9kZWwpO1xuICBnbC51bmlmb3JtMWkoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwiaXNMaWdodFwiKSwgMCk7XG59XG5cbmZ1bmN0aW9uIGRyYXdWQU8odmFvKSB7XG4gIGlmICghdmFvLnZlcnRleEJ1ZmZlcikgcmV0dXJuO1xuXG4gIGxvYWRNYXRlcmlhbCh2YW8ubWF0ZXJpYWwpXG5cbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZhby52ZXJ0ZXhCdWZmZXIpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocHJvZ3JhbS5wb3NpdGlvbkF0dHJpYnV0ZSwgMywgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdmFvLm5vcm1hbEJ1ZmZlcilcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihwcm9ncmFtLm5vcm1hbEF0dHJpYnV0ZSwgMywgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICB2YXIgaXNUZXh0dXJlZCA9IHZhby5tYXRlcmlhbC50ZXh0dXJlICYmIHZhby5pc1RleHR1cmVkXG4gIC8vIGNvbnNvbGUubG9nKGlzVGV4dHVyZWQpXG4gIGdsLnVuaWZvcm0xaShnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJpc1RleHR1cmVkXCIpLCBpc1RleHR1cmVkKTtcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHZhby50ZXh0dXJlQnVmZmVyKVxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHByb2dyYW0udGV4dHVyZUF0dHJpYnV0ZSwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgaWYgKGlzVGV4dHVyZWQpIHtcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB2YW8ubWF0ZXJpYWwudGV4dHVyZSk7XG4gICAgZ2wudW5pZm9ybTFpKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInNhbXBsZXJcIiksIDApO1xuICB9XG5cbiAgLy8gZHJhd1xuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgdmFvLm51bVZlcnRleCk7XG59XG5cbmZ1bmN0aW9uIGxvYWRNYXRlcmlhbChtYXRlcmlhbCkge1xuICBpZiAoIW1hdGVyaWFsKSBtYXRlcmlhbCA9IHtcbiAgICBhbWJpZW50OiBbMSwgMSwgMV0sXG4gICAgZGlmZnVzZTogWzEsIDEsIDFdLFxuICAgIHNwZWN1bGFyOiBbMSwgMSwgMV0sXG4gICAgc2hpbmluZXNzOiAwLFxuICB9O1xuICAvLyBTZXQgbWF0ZXJpYWwgcHJvcGVydGllc1xuICBnbC51bmlmb3JtM2YoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibWF0ZXJpYWwuYW1iaWVudFwiKSwgICBtYXRlcmlhbC5hbWJpZW50WzBdLCBtYXRlcmlhbC5hbWJpZW50WzFdLCBtYXRlcmlhbC5hbWJpZW50WzJdKTtcbiAgZ2wudW5pZm9ybTNmKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcIm1hdGVyaWFsLmRpZmZ1c2VcIiksICAgbWF0ZXJpYWwuZGlmZnVzZVswXSwgbWF0ZXJpYWwuZGlmZnVzZVsxXSwgbWF0ZXJpYWwuZGlmZnVzZVsyXSk7XG4gIGdsLnVuaWZvcm0zZihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJtYXRlcmlhbC5zcGVjdWxhclwiKSwgIG1hdGVyaWFsLnNwZWN1bGFyWzBdLCBtYXRlcmlhbC5zcGVjdWxhclsxXSwgbWF0ZXJpYWwuc3BlY3VsYXJbMl0pO1xuICBnbC51bmlmb3JtMWYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibWF0ZXJpYWwuc2hpbmluZXNzXCIpLCBtYXRlcmlhbC5zaGluaW5lc3MpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWFrZU1vZGVsLFxuICBjcmVhdGVNb2RlbCxcbiAgZHJhd01vZGVsLFxuICBkcmF3TGlnaHQsXG59XG4iLCJ2YXIgc2hhZGVycyA9IHt9XG5cbmZ1bmN0aW9uIGNvbXBpbGVTaGFkZXIoZ2wsIHNoYWRlclNvdXJjZSwgc2hhZGVyVHlwZSkge1xuICAvLyBDcmVhdGUgdGhlIHNoYWRlciBvYmplY3RcbiAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihzaGFkZXJUeXBlKTtcblxuICAvLyBTZXQgdGhlIHNoYWRlciBzb3VyY2UgY29kZS5cbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc2hhZGVyU291cmNlKTtcblxuICAvLyBDb21waWxlIHRoZSBzaGFkZXJcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xuXG4gIC8vIENoZWNrIGlmIGl0IGNvbXBpbGVkXG4gIHZhciBzdWNjZXNzID0gZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpO1xuICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAvLyBTb21ldGhpbmcgd2VudCB3cm9uZyBkdXJpbmcgY29tcGlsYXRpb247IGdldCB0aGUgZXJyb3JcbiAgICB0aHJvdyBcImNvdWxkIG5vdCBjb21waWxlIHNoYWRlcjpcIiArIGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKTtcbiAgfVxuXG4gIHJldHVybiBzaGFkZXI7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2dyYW0oZ2wsIG5hbWUsIHZlcnRleFNoYWRlciwgZnJhZ21lbnRTaGFkZXIpIHtcbiAgLy8gY3JlYXRlIGEgcHJvZ3JhbS5cbiAgdmFyIHByb2dyYSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcblxuICAvLyBhdHRhY2ggdGhlIHNoYWRlcnMuXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmEsIHZlcnRleFNoYWRlcik7XG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmEsIGZyYWdtZW50U2hhZGVyKTtcblxuICAvLyBsaW5rIHRoZSBwcm9ncmFtLlxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmEpO1xuXG4gIGdsLmRlbGV0ZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpXG4gIGdsLmRlbGV0ZVNoYWRlcihmcmFnbWVudFNoYWRlcilcblxuICAvLyBDaGVjayBpZiBpdCBsaW5rZWQuXG4gIHZhciBzdWNjZXNzID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmEsIGdsLkxJTktfU1RBVFVTKTtcbiAgaWYgKCFzdWNjZXNzKSB7XG4gICAgLy8gc29tZXRoaW5nIHdlbnQgd3Jvbmcgd2l0aCB0aGUgbGlua1xuICAgIHRocm93IChcInByb2dyYW0gZmlsZWQgdG8gbGluazpcIiArIGdsLmdldFByb2dyYW1JbmZvTG9nIChwcm9ncmEpKTtcbiAgfVxuXG4gIHdpbmRvdy5wcm9ncmFtID0gcHJvZ3JhO1xuICBwcm9ncmFtLnBvc2l0aW9uQXR0cmlidXRlID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3Bvc2l0aW9uXCIpO1xuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShwcm9ncmFtLnZlcnRleEF0dHJpYnV0ZSk7XG5cbiAgcHJvZ3JhbS5ub3JtYWxBdHRyaWJ1dGUgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfbm9ybWFsXCIpO1xuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShwcm9ncmFtLm5vcm1hbEF0dHJpYnV0ZSk7XG5cbiAgcHJvZ3JhbS50ZXh0dXJlQXR0cmlidXRlID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgXCJhX3RleHR1cmVcIik7XG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHByb2dyYW0udGV4dHVyZUF0dHJpYnV0ZSk7XG5cbiAgc2hhZGVyc1tuYW1lXSA9IHByb2dyYTtcbn1cblxuZnVuY3Rpb24gb3BlbkZpbGUobmFtZSwgZmlsZW5hbWUpe1xuICAkLmdldChmaWxlbmFtZSArICcudnMnLCBmdW5jdGlvbiAodnhTaGFkZXJEYXRhKSB7XG4gICAgdmFyIHZ4U2hhZGVyID0gY29tcGlsZVNoYWRlcihnbCwgdnhTaGFkZXJEYXRhLCBnbC5WRVJURVhfU0hBREVSKVxuICAgICQuZ2V0KGZpbGVuYW1lICsgJy5mcmFnJywgZnVuY3Rpb24gKGZyYWdTaGFkZXJEYXRhKSB7XG4gICAgICB2YXIgZnJhZ1NoYWRlciA9IGNvbXBpbGVTaGFkZXIoZ2wsIGZyYWdTaGFkZXJEYXRhLCBnbC5GUkFHTUVOVF9TSEFERVIpXG4gICAgICBjcmVhdGVQcm9ncmFtKGdsLCBuYW1lLCB2eFNoYWRlciwgZnJhZ1NoYWRlcilcbiAgICB9LCAndGV4dCcpO1xuICB9LCAndGV4dCcpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTaGFkZXIoc2hhZGVybmFtZSkge1xuICAvL2ZvciBkamFuZ28gd2Vic2l0ZTsgL3N0YXRpYy90dW5uZWxfcnVzaC9zaGFkZXJzIGlzIHRha2VuIGFzIHVybCwgd2l0aG91dCAnLycgaW4gZnJvbnQsIGl0IGlzIHRha2VuIGFzIGZpbGUgcGF0aC5cbiAgb3BlbkZpbGUoc2hhZGVybmFtZSwgJy9zdGF0aWMvdHVubmVsX3J1c2gvc2hhZGVycy8nICsgc2hhZGVybmFtZSlcbiAgLy8gb3BlbkZpbGUoc2hhZGVybmFtZSwgJ3NoYWRlcnMvJyArIHNoYWRlcm5hbWUpXG59XG5cbmZ1bmN0aW9uIHVzZVNoYWRlcihzaGFkZXJuYW1lKSB7XG4gIHdpbmRvdy5wcm9ncmFtID0gc2hhZGVyc1tzaGFkZXJuYW1lXVxuICBnbC51c2VQcm9ncmFtKHdpbmRvdy5wcm9ncmFtKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNvbXBpbGVTaGFkZXIsXG4gIGNyZWF0ZVNoYWRlcixcbiAgdXNlU2hhZGVyLFxufVxuIiwiZnVuY3Rpb24gZG90KFt4LCB5LCB6XSwgW3AsIHEsIHJdKSB7XG4gIHJldHVybiB4KnAgKyB5KnEgKyB6KnJcbn1cblxuZnVuY3Rpb24gY3Jvc3MoW3V4LCB1eSwgdXpdLCBbdngsIHZ5LCB2el0pIHtcbiAgdmFyIHggPSB1eSp2eiAtIHV6KnZ5O1xuICB2YXIgeSA9IHV6KnZ4IC0gdXgqdno7XG4gIHZhciB6ID0gdXgqdnkgLSB1eSp2eDtcbiAgcmV0dXJuIFt4LCB5LCB6XTtcbn1cblxuZnVuY3Rpb24gYWRkKFt4LCB5LCB6XSwgW3AsIHEsIHJdKSB7XG4gIHJldHVybiBbeCArIHAsIHkgKyBxLCB6ICsgcl1cbn1cblxuZnVuY3Rpb24gc3VidHJhY3QoW3gsIHksIHpdLCBbcCwgcSwgcl0pIHtcbiAgcmV0dXJuIFt4IC0gcCwgeSAtIHEsIHogLSByXVxufVxuXG5mdW5jdGlvbiBhYnMoW3gsIHksIHpdKSB7XG4gIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5ICsgeip6KVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemUoW3gsIHksIHpdKSB7XG4gIHZhciB0ID0gYWJzKFt4LCB5LCB6XSlcbiAgcmV0dXJuIFt4L3QsIHkvdCwgei90XVxufVxuXG5mdW5jdGlvbiBtdWx0aXBseVNjYWxhcihbeCwgeSwgel0sIGMpIHtcbiAgcmV0dXJuIFt4KmMsIHkqYywgeipjXVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZG90LFxuICBjcm9zcyxcbiAgYWRkLFxuICBzdWJ0cmFjdCxcbiAgYWJzLFxuICBub3JtYWxpemUsXG4gIG11bHRpcGx5U2NhbGFyLFxufVxuIl19
