let currentMode = 'pitch';
let isStarted = false;
let osc, envelope, noise, filter;
let trails = [];

// 音高相关
const majorScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

// 节拍相关
let beatType = 4; // 默认4/4
let currentBeat = 0;
let lastBeatTime = 0;
let bpm = 60; 
let beatInterval = 60000 / bpm;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  
  // 音高振荡器
  osc = new p5.Oscillator('sine');
  envelope = new p5.Envelope();
  envelope.setADSR(0.05, 0.1, 0.3, 0.5);
  osc.start();
  osc.amp(0);

  // 节拍音效（模拟打击乐）
  noise = new p5.Noise('white');
  noise.start();
  noise.amp(0);
  filter = new p5.LowPass();
  noise.disconnect();
  noise.connect(filter);
}

window.startLabAudio = function() {
  userStartAudio();
  isStarted = true;
};

window.setLabMode = function(m) {
  currentMode = m;
  trails = [];
};

window.updateBeatType = function(num) {
  beatType = num;
  currentBeat = 0;
  lastBeatTime = millis();
};

function draw() {
  if (!isStarted) return;
  background(0, 0, 5);

  if (currentMode === 'pitch') {
    runPitchMode();
  } else if (currentMode === 'beat') {
    runBeatMode();
  } else {
    fill(255);
    textAlign(CENTER);
    text(currentMode + " 模式开发中...", width/2, height/2);
  }
}

// --- 音高逻辑不变 ---
function runPitchMode() {
  let stepHeight = height / majorScale.length;
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

// --- 新增：节拍逻辑 ---
function runBeatMode() {
  let now = millis();
  if (now - lastBeatTime > beatInterval) {
    lastBeatTime = now;
    currentBeat = (currentBeat % beatType) + 1;
    handleBeatSensory(currentBeat);
  }

  // 视觉呈现
  drawBeatVisuals(currentBeat);
}

function handleBeatSensory(beat) {
  // 1. 声音反馈（强拍频率低沉，弱拍高亮）
  let fFreq = (beat === 1) ? 400 : 1200;
  filter.freq(fFreq);
  noise.amp(0.5, 0);
  noise.amp(0, 0.1);

  // 2. 触觉反馈 
  if (window.navigator.vibrate) {
    if (beat === 1) window.navigator.vibrate(200); // 强拍长振
    else if (beatType === 4 && beat === 3) window.navigator.vibrate(100); // 次强拍中振
    else window.navigator.vibrate(50); // 弱拍短振
  }
}

function drawBeatVisuals(beat) {
  let centerX = width / 2;
  let centerY = height / 2;
  noStroke();

  if (beatType === 2) {
    // 2/4 拍：两个点交替 
    for (let i = 1; i <= 2; i++) {
      let isCurrent = (beat === i);
      let x = centerX + (i === 1 ? -100 : 100);
      fill(isCurrent ? (i === 1 ? 0 : 200) : 255, 80, isCurrent ? 100 : 20);
      ellipse(x, centerY, isCurrent && i === 1 ? 120 : 80); 
    }
  } else if (beatType === 3) {
    // 3/4 拍：三点画圆，强拍在顶 
    for (let i = 1; i <= 3; i++) {
      let angle = -HALF_PI + (TWO_PI / 3) * (i - 1);
      let x = centerX + cos(angle) * 150;
      let y = centerY + sin(angle) * 150;
      let isCurrent = (beat === i);
      fill(isCurrent ? 50 : 255, 80, isCurrent ? 100 : 20);
      ellipse(x, y, isCurrent && i === 1 ? 100 : 70);
    }
  } else if (beatType === 4) {
    // 4/4 拍：红(强)、黄(次强)、蓝(弱) 
    let colors = [0, 210, 50, 210]; // 对应 HSB：红、蓝、黄、蓝
    for (let i = 1; i <= 4; i++) {
      let x = centerX - 150 + (i - 1) * 100;
      let isCurrent = (beat === i);
      // 强拍红，次强拍黄，弱拍蓝
      let h = (i === 1) ? 0 : (i === 3 ? 50 : 210); 
      fill(h, 80, isCurrent ? 100 : 20);
      ellipse(x, centerY, isCurrent ? 90 : 60);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
