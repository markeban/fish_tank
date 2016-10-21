var values = {
  friction: 9.8,
  timeStep: 0.05,
  amount: 15,
  mass: 2,
  count: 0
};

var fishes = [];
var bubbles = [];
var fishValues = [
  {
    startingPositionFactor: [0.8, 0.3],
    directionRight: true,
    colors: ["green", "yellow"] 
  },
  {
    startingPositionFactor: [0.3, 0.5],
    directionRight: false,
    colors: ["red", "purple"]
  }
];
var weeds = [];
var weedValues = [
  {
    startingXPositionFactor: 0.8
  },
  {
    startingXPositionFactor: 0.77
  }
];
var diver;
var post;

values.invMass = 1 / values.mass;

var path, springs, mouseLocation;
var size = view.size * [1.2, 1];

function onResize() { // 1st
  bubbles = []; // kill all bubbles on resize
  if (path)
    path.remove();
  size = view.bounds.size * [2, 1];
  path = createPath(0.1);
  drawFishes();
  drawSand();
  drawWeeds();
  drawChest();
  drawDiver();
}

function onFrame(event) { // 4th
  updateWave(path);
  updateFishes();
  riseBubbles();
  swayWeeds(event);
  equalizeDiver(event); 
}

function onMouseMove(event) {
  mouseLocation = event.point;
}


var Spring = function(a, b, strength, restLength) { //3rd (as many times segments)
  this.a = a;
  this.b = b;
  this.restLength = restLength || 80;
  this.strength = strength ? strength : 0.01;
  this.mamb = values.invMass * values.invMass;
};

Spring.prototype.update = function() { // 6th
  var delta = this.b - this.a;
  var dist = delta.length;
  var normDistStrength = (dist - this.restLength) /
      (dist * this.mamb) * this.strength;
  delta.y *= normDistStrength * values.invMass * 0.2;
  if (!this.a.fixed)
    this.a.y += delta.y;
  if (!this.b.fixed)
    this.b.y -= delta.y;
};

function createPath(strength) { // 2nd
  var path = new Path({
    fillColor: '#3987c9'
  });
  springs = [];
  for (var i = 0; i <= values.amount; i++) {
    var segment = path.add(new Point(i / values.amount, 0.1) * size);
    var point = segment.point;
    if (i == 0 || i == values.amount)
      point.y += size.height;
    point.px = point.x;
    point.py = point.y;
    // The first two and last two points are fixed:
    point.fixed = i < 2 || i > values.amount - 2;
    if (i > 0) {
      var spring = new Spring(segment.previous.point, point, strength);
      springs.push(spring);
    }
  }
  path.position.x -= size.width / 4;
  // path.selected = true;
  return path;
}

function hitWave(bubblePoint) {
  var location = path.getNearestLocation(bubblePoint);
  var segment = location.segment;
  var point = segment.point;

  if (!point.fixed && location.distance < size.height / 4) {
    var y = bubblePoint.y - .7;
    point.y += (y - point.y) / 6;
    if (segment.previous && !segment.previous.fixed) {
      var previous = segment.previous.point;
      previous.y += (y - previous.y) / 24;
    }
    if (segment.next && !segment.next.fixed) {
      var next = segment.next.point;
      next.y += (y - next.y) / 24;
    }
  }
}

function updateWave(path) { // 5th
  var force = 1 - values.friction * values.timeStep * values.timeStep;
  for (var i = 0, l = path.segments.length; i < l; i++) {
    var point = path.segments[i].point;
    var dy = (point.y - point.py) * force;
    point.py = point.y;
    point.y = Math.max(point.y + dy, 0);
  }

  for (var j = 0, l = springs.length; j < l; j++) {
    springs[j].update();
  }
  path.smooth({ type: 'continuous' });
}

function onKeyDown(event) {
  if (event.key == 'space') {
    path.fullySelected = !path.fullySelected;
    path.fillColor = path.fullySelected ? null : 'black';
  }
}



function drawFishes() {
  for (i=0; i < fishValues.length; i++) {
    var fish = new Fish(fishValues[i]);
    fish.wigglePosition = 2;
    fish.directionRight = fishValues[i].directionRight;
    fish.fishBody.position = [fishValues[i].startingPositionFactor[0] * view.bounds.right, fishValues[i].startingPositionFactor[1] * view.bounds.bottom];
    if (!fishValues[i].directionRight) {
      fish.fishBody.scale(-1, 1);
    }
    fishes.push(fish);
  }
}

function Fish(fishValues) {
  function fishBody() {
    var fishBody = new Path();
    fishBody.add(new Point(0, 5)); // left top back fin
    fishBody.add(new Point(15, 0)); // right top back fin
    fishBody.add(new Point(30, 25)); // base of fishBody
    fishBody.add(new Point(80, 20)); // bottom left dorsel fin
    fishBody.add(new Point(70, 0)); // top dorsel fin
    fishBody.add(new Point(85, 0)); // top dorsel fin
    fishBody.add(new Point(120, 15)); // bottom right dorsel
    fishBody.add(new Point(150, 15)); // bottom right dorsel
    fishBody.add(new Point(170, 45)); // nose tip of fishBody
    fishBody.add(new Point(145, 55)); // mouth concave
    fishBody.add(new Point(155, 65)); // mouth bottom
    fishBody.add(new Point(125, 75)); // bottom jaw
    fishBody.add(new Point(40, 60));
    fishBody.add(new Point(15, 85)); // right bottom of fin
    fishBody.add(new Point(0, 85)); // left bottom of fin
    fishBody.add(new Point(10, 45)); // middle tail fin
    fishBody.closed = true;
    fishBody.strokeColor = 'black';
    fishBody.fillColor =  {
      gradient: {
        stops: fishValues.colors
      },
      origin: fishBody.bounds.left,
      destination: fishBody.bounds.right
    };
    fishBody.smooth(); 
    return fishBody; 
  }
  function drawFishEye() {
    var fishEye = new Path.Circle(new Point(135, 35), 10);
    fishEye.fillColor = 'white';
    fishEye.strokeColor = 'black';
    fishEye.strokeWidth = 3;
    return fishEye;
  }
  function drawFishEyePupil(fishEye) {
    var fishEyePupil = new Path.Circle(new Point(135, 35), 3);
    fishEyePupil.fillColor = 'black';
    return fishEyePupil;
  }
  this.fishBody = fishBody();
  this.fishEye = drawFishEye();
  this.fishEyePupil = drawFishEyePupil();
}

function updateFishes() {
  for (i=0; i < fishes.length; i++) {
    fishes[i].updateFish();
    fishes[i].updateFishEye();
    fishes[i].wiggleFish();
    if (Math.random() > 0.995) {
      bubbles.push(new Bubble(fishes[i].fishBody.segments[7].point));
    }
  }
}

Fish.prototype.updateFish = function() {
  if (this.fishBody.bounds.right >= view.size.width) {
    this.directionRight = false;
    this.fishBody.scale(-1, 1);
    this.fishBody.position += [-1, 1];
  } else if (this.fishBody.bounds.left <= 0) {
    this.directionRight = true;
    this.fishBody.scale(-1, 1);
    this.fishBody.position += [1, 1];
  }
  var vector = this.directionRight ? [1, 0] : [-1, 0];
  this.fishBody.position += vector;
}

Fish.prototype.updateFishEye = function() { 
  function updateFishEyePupil(fish) {
    var fishEyePupilPosition;    
    var vector;
    if (mouseLocation) {
      vector = mouseLocation - fish.fishEye.position;
      fishEyePupilPosition = fish.fishEye.position + (vector.normalize() * 2);
    } else {
      fishEyePupilPosition = fish.fishEye.position;
    }
    return fishEyePupilPosition;
  }
  this.fishEyePupil.position = updateFishEyePupil(this);
  this.fishEye.position = this.fishBody.segments[7].point + [0, 10];
}

Fish.prototype.wiggleFish = function() {
  var wiggleUp = [1, 2];
  var wiggleDown = [-1, -2];
  if (this.wigglePosition >= 0 && this.wigglePosition <= 3) {
    this.fishBody.segments[0].point += wiggleUp;
    this.fishBody.segments[1].point += wiggleUp;
    this.fishBody.segments[13].point += wiggleUp;
    this.fishBody.segments[14].point += wiggleUp;
    this.wigglePosition += 1;
  } else {
    this.fishBody.segments[0].point += wiggleDown;
    this.fishBody.segments[1].point += wiggleDown;
    this.fishBody.segments[13].point += wiggleDown;
    this.fishBody.segments[14].point += wiggleDown;

    this.wigglePosition === 7 ? this.wigglePosition = 0 : this.wigglePosition += 1;
  }
}


function Bubble(position) {
  var bubble = new Path.Circle(position, 3);
  bubble.strokeColor = 'black';
  this.properties = bubble; // ask about this one; how can I avoid 'properties'?
}

Bubble.prototype.riseBubble = function() {
  this.properties.position += [0, -2];
  this.properties.scale(1.003, 1.003);
  var intersections = path.getIntersections(this.properties);
  if (intersections.length > 1) {
    this.properties.remove();
    hitWave(intersections[0].point);
  }
}

function riseBubbles() {
  for(var i=0; i < bubbles.length; i++) {
    bubbles[i].riseBubble();
  }
}

function drawWeeds() {
  weeds = [];
  for (var i=0; i < weedValues.length; i++) {
    weeds.push(new Weed(weedValues[i]));
  }
}

function Weed(weedValue) {
  var weed = new Path({
    strokeColor: "green",
    strokeWidth: 15,
    strokeCap: 'round'
  });
  var segment = 25;
  for (var i=0; i < 6; i++) {
    weed.add(new Point((weedValue.startingXPositionFactor * view.bounds.right), view.bounds.bottom - segment));
    segment += 50;
  }
  this.properties = weed;
  
}


function swayWeeds(event) {
  for (var i=0; i < weeds.length; i++) {
    swayWeed(weeds[i], event);
  }
}

function swayWeed(weed, event) {
  for (var i=1; i < weed.properties.segments.length; i++) {
    var segment = weed.properties.segments[i];
    var sinus = Math.sin(event.time * 3 + i);
    segment.point.x += sinus * 0.5;
  }
  weed.properties.smooth();
}

function drawSand() {
  var rectangle = new Rectangle(0, view.size.height - 50, view.size.width, 50);
  var sand = new Path.Rectangle(rectangle);
  sand.fillColor = '#c2b180';
}

function drawChest() {
  var chest = new Raster('treasure-chest');
  chest.scale(0.225);
  chest.position = [view.size.width * 0.5, view.size.height - 75]
}

function drawDiver() {
  diver = new Raster('scuba-diver');
  diver.scale(0.5);
  diver.position = [(view.size.width * 0.5) - 200, view.size.height - 125];
}

function equalizeDiver(event) {
  var sinus = Math.sin(event.time  + i);
  diver.position.y += sinus * 0.1;
  if (Math.random() > 0.995) {
    bubbles.push(new Bubble(diver.position + [105, -20]));
  }
}





