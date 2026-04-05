let currentMode = 'pitch';
let isStarted = false;
let osc, envelope;
let trails = [];

// C大调自然音阶频率 (C4-C5)
const majorScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  
  // 初始化声音系统
  osc = new p5.Oscillator('sine');
  envelope = new p5.Envelope();
  envelope.setADSR(0.05, 0.1, 0.3, 0.5); // 类似钢琴的包络 [cite: 19]
  osc.start();
  osc.amp(0);
}

// 被 index.html 调用的函数
window.startLabAudio = function() {
  userStartAudio(); // 核心：激活浏览器音频上下文
  isStarted = true;
};

// 被 index.html 调用的切换函数
window.setLabMode = function(m) {
  currentMode = m;
  trails = []; // 切换模式时清空画布 [cite: 29]
};

function draw() {
  if (!isStarted) return;
  background(0, 0, 5);

  if (currentMode === 'pitch') {
    runPitchMode();
  } else {
    fill(255);
    textAlign(CENTER);
    text(currentMode + " 模式开发中...", width/2, height/2);
  }
}

function runPitchMode() {
  // 划分音高区域：屏幕被均分为音阶长度的横向条带 [cite: 3, 26]
  let stepHeight = height / majorScale.length;
  let index = floor(map(mouseY, height, 0, 0, majorScale.length));
  index = constrain(index, 0, majorScale.length - 1);

  // 映射颜色：音符越高颜色越暖 (蓝->绿->黄->红) [cite: 3, 26]
  let hueValue = map(index, 0, majorScale.length - 1, 220, 0);

  if (mouseIsPressed) {
    // 触发声音
    osc.freq(majorScale[index]);
    envelope.play(osc);

    // 记录轨迹 (创意授权驱动力) [cite: 27]
    trails.push({x: mouseX, y: mouseY, h: hueValue});
    
    // 视觉实时反馈
    noStroke();
    fill(hueValue, 80, 100, 0.6);
    ellipse(mouseX, mouseY, 50);
  }

  // 绘制积累的旋律画廊 [cite: 29]
  for (let t of trails) {
    fill(t.h, 70, 80, 0.4);
    ellipse(t.x, t.y, 10);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
