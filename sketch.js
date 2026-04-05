let mode = 'pitch';
let trails = []; // 存储旋律线 
let beatCount = 0;
let lastBeatTime = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100); // 使用 HSB 方便处理冷暖色映射 [cite: 3]
}

function draw() {
  background(0, 0, 5); // 深色背景
  
  if (mode === 'pitch') {
    handlePitchMode();
  } else if (mode === 'beat') {
    handleBeatMode();
  } else if (mode === 'volume') {
    handleVolumeMode();
  } else if (mode === 'chord') {
    handleChordMode();
  }
}

// 设计1：音高可视化 [cite: 25]
function handlePitchMode() {
  // 映射：位置越高 -> 颜色越暖 
  let hue = map(mouseY, height, 0, 240, 0); // 蓝(240)到红(0)
  let bright = map(mouseY, height, 0, 50, 100);
  
  if (mouseIsPressed) {
    // 创意授权：学生自由画出旋律线 
    trails.push({x: mouseX, y: mouseY, h: hue}); 
    fill(hue, 80, bright);
    ellipse(mouseX, mouseY, 40);
  }
  
  // 绘制积累的旋律画廊 [cite: 29]
  for (let p of trails) {
    noStroke();
    fill(p.h, 70, 80, 0.5);
    ellipse(p.x, p.y, 10);
  }
}

// 设计2：节拍可视化 [cite: 31]
function handleBeatMode() {
  let interval = 1000; // 假设 60 BPM
  let now = millis();
  
  if (now - lastBeatTime > interval) {
    lastBeatTime = now;
    beatCount = (beatCount % 4) + 1;
    triggerVibrate(beatCount); // 触觉反馈 
  }

  // 心跳线波动 [cite: 8]
  stroke(beatCount === 1 ? 0 : 200, 80, 100); 
  noFill();
  beginShape();
  for (let x = 0; x < width; x += 10) {
    let wave = (beatCount === 1) ? 100 : 20; // 强拍剧烈跳动 [cite: 8]
    let y = height/2 + sin(x * 0.02 + frameCount * 0.1) * wave;
    vertex(x, y);
  }
  endShape();
}

// 设计3：音量与力度 [cite: 35]
function handleVolumeMode() {
  let r = map(mouseX, 0, width, 20, 200); // 映射光晕半径 [cite: 11]
  noStroke();
  for(let i = 5; i > 0; i--) {
    fill(60, 80, 100, 0.2); // 黄色光效
    ellipse(width/2, height/2, r * i * 0.5);
  }
  // 提示文字
  fill(255);
  text(mouseX < width/2 ? "p (Piano)" : "f (Forte)", width/2 - 20, height/2 + r + 20);
}

// 设计4：和弦色彩 [cite: 39]
function handleChordMode() {
  // 大三和弦暖色，小三和弦冷色 [cite: 15, 40]
  if (mouseX < width/2) {
    background(20, 80, 40); // 暖橙色
    fill(255); text("大三和弦：明亮快乐", 50, 100);
  } else {
    background(240, 80, 40); // 冷蓝色
    fill(255); text("小三和弦：柔和忧伤", width/2 + 50, 100);
  }
}

// 辅助功能：手机振动接口 [cite: 9, 32]
function triggerVibrate(beat) {
  if (!window.navigator.vibrate) return;
  if (beat === 1) window.navigator.vibrate(300); // 强拍长振
  else window.navigator.vibrate(100); // 弱拍短振
}

function setMode(m) {
  mode = m;
  trails = [];
  document.getElementById('title').innerText = m.toUpperCase() + " 模式";
}
