let notes = [];
let beatTimer = 0;
let currentMode = 'pitch'; // pitch, beat, volume, chord

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100); // 使用 HSB 方便实现“冷暖色”转换 [cite: 3, 15]
}

function draw() {
  background(0, 0, 5); // 深色背景突出光效 
  
  if (currentMode === 'pitch') {
    drawPitchMode();
  } else if (currentMode === 'beat') {
    drawBeatMode();
  }
}

// 设计1：音高可视化 [cite: 25]
function drawPitchMode() {
  // 映射逻辑：位置越高，颜色越暖 (240蓝 -> 0红) 
  let hueValue = map(mouseY, height, 0, 240, 0);
  let brightness = map(mouseY, height, 0, 40, 100); [cite: 3]
  
  fill(hueValue, 80, brightness);
  noStroke();
  ellipse(mouseX, mouseY, 50, 50); 
  
  // 创意授权：实时线条 
  if (mouseIsPressed) {
    notes.push({x: mouseX, y: mouseY, h: hueValue});
  }
  
  for (let n of notes) {
    fill(n.h, 80, 80);
    ellipse(n.x, n.y, 10, 10);
  }
}

// 设计2：节拍可视化 [cite: 31]
function drawBeatMode() {
  beatTimer += deltaTime;
  let beatInterval = 1000; // 1秒一拍
  let phase = (beatTimer % beatInterval) / beatInterval;
  
  // 模拟心跳线波动 
  stroke(phase < 0.2 ? 0 : 200, 80, 100); 
  strokeWeight(4);
  beginShape();
  for (let x = 0; x < width; x++) {
    let y = height/2 + sin(x * 0.02 + frameCount * 0.1) * (phase < 0.2 ? 100 : 20);
    vertex(x, y);
  }
  endShape();
  
  // 手机振动逻辑 
  if (phase < 0.05 && window.navigator.vibrate) {
    window.navigator.vibrate(200); // 强拍长振 
  }
}

// 响应窗口大小变化
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
