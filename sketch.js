let currentMode = 'pitch';
let isStarted = false;
let osc, envelope, noise, filter;
let trails = [];

// 音高参数
const majorScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

// 节拍挑战参数
let quizLevel = 0; 
let beatLevels = [2, 3, 4];
let currentBeat = 0;
let lastBeatTime = 0;
let bpm = 80;
let beatInterval = 60000 / bpm;
let waveAmp = 0; // 实时波动幅度

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  
  osc = new p5.Oscillator('sine');
  envelope = new p5.Envelope();
  envelope.setADSR(0.05, 0.1, 0.3, 0.5);
  osc.start(); osc.amp(0);

  noise = new p5.Noise('white');
  noise.start(); noise.amp(0);
  filter = new p5.LowPass();
  noise.disconnect(); noise.connect(filter);
}

window.startLabAudio = function() {
  userStartAudio();
  isStarted = true;
};

window.setLabMode = function(m) {
  currentMode = m;
  trails = [];
  if (m === 'beat') {
    quizLevel = 0; 
    currentBeat = 0;
    lastBeatTime = millis();
  }
};

window.submitBeatAnswer = function(ans) {
  if (ans === beatLevels[quizLevel]) {
    if (quizLevel < beatLevels.length - 1) {
      setTimeout(() => { 
        quizLevel++; 
        currentBeat = 0;
      }, 1000);
    } else {
      setTimeout(() => { alert("祝贺！你已通过所有节拍感官挑战！"); }, 500);
    }
    return true;
  }
  return false;
};

function draw() {
  if (!isStarted) return;
  background(0, 0, 5);

  if (currentMode === 'pitch') {
    runPitchMode();
  } else if (currentMode === 'beat') {
    runBeatQuizMode();
  } else {
    fill(255); textAlign(CENTER);
    text(currentMode + " 模式开发中...", width/2, height/2);
  }
}

// 音高模式逻辑 (保持不变)
function runPitchMode() {
  let index = floor(map(mouseY, height, 0, 0, majorScale.length));
  index = constrain(index, 0, majorScale.length - 1);
  let hueValue = map(index, 0, majorScale.length - 1, 220, 0);

  if (mouseIsPressed) {
    osc.freq(majorScale[index]);
    envelope.play(osc);
    trails.push({x: mouseX, y: mouseY, h: hueValue});
    noStroke();
    fill(hueValue, 80, 100, 0.6);
    ellipse(mouseX, mouseY, 50);
  }
  for (let t of trails) {
    fill(t.h, 70, 80, 0.4);
    ellipse(t.x, t.y, 10);
  }
}

// 节拍挑战逻辑：心跳线版本
function runBeatQuizMode() {
  let targetBeat = beatLevels[quizLevel];
  let now = millis();
  
  if (now - lastBeatTime > beatInterval) {
    lastBeatTime = now;
    currentBeat = (currentBeat % targetBeat) + 1;
    handleBeatSensory(currentBeat, targetBeat);
    waveAmp = 1.0; // 触发瞬间振幅最大
  }

  // 振幅衰减，模拟脉冲效果
  waveAmp *= 0.9; 

  drawHeartbeatLine(currentBeat, targetBeat, waveAmp);
  
  fill(255); textAlign(CENTER); textSize(18);
  text("感受心跳线的波动规律并选择：", width/2, 80);
  text("当前关卡: " + (quizLevel + 1) + "/3", width/2, height - 50);
}

function handleBeatSensory(beat, type) {
  filter.freq(beat === 1 ? 400 : 1500);
  noise.amp(0.6, 0); noise.amp(0, 0.1);

  if (window.navigator.vibrate) {
    if (beat === 1) window.navigator.vibrate(200); // 强拍长振 [cite: 9]
    else if (type === 4 && beat === 3) window.navigator.vibrate(100); // 次强中振 [cite: 9]
    else window.navigator.vibrate(50); // 弱拍短振 [cite: 9]
  }
}

function drawHeartbeatLine(beat, type, amp) {
  let centerX = width / 2;
  let centerY = height / 2;
  
  // 核心逻辑：根据拍子决定颜色和幅度
  let lineHue = 210; // 默认蓝色 (弱拍) 
  let maxJump = 30;  // 默认小波动
  
  if (beat === 1) {
    lineHue = 0;      // 红色 (强拍) 
    maxJump = 150;    // 大波动 
  } else if (type === 4 && beat === 3) {
    lineHue = 120;    // 绿色 (次强拍)
    maxJump = 80;     // 中波动
  }

  stroke(lineHue, 80, 100);
  strokeWeight(4);
  noFill();
  
  beginShape();
  for (let x = 0; x < width; x += 5) {
    // 模拟心跳波形逻辑
    let distToCenter = abs(x - centerX);
    let peak = 0;
    
    // 只在屏幕中央附近产生剧烈跳动
    if (distToCenter < 100) {
      peak = sin(map(distToCenter, 0, 100, 0, PI * 2)) * maxJump * amp;
    }
    
    // 叠加背景微弱震荡
    let y = centerY + peak + sin(x * 0.05 + frameCount * 0.2) * 5;
    vertex(x, y);
  }
  endShape();
  
  // 绘制辅助装饰点，增强节奏感
  fill(lineHue, 80, 100);
  noStroke();
  ellipse(centerX, centerY - maxJump * amp, 10);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
