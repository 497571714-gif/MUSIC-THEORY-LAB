let currentMode = 'pitch';
let isStarted = false;
let osc, envelope, noise, filter;
let trails = [];

// 音高参数
const majorScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

// 节拍挑战参数
let quizLevel = 0; // 0: 2/4拍, 1: 3/4拍, 2: 4/4拍
let beatLevels = [2, 3, 4];
let currentBeat = 0;
let lastBeatTime = 0;
let bpm = 80;
let beatInterval = 60000 / bpm;

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
    quizLevel = 0; // 重置到第一关 2/4 拍
    currentBeat = 0;
    lastBeatTime = millis();
  }
};

// 处理答题逻辑
window.submitBeatAnswer = function(ans) {
  if (ans === beatLevels[quizLevel]) {
    if (quizLevel < beatLevels.length - 1) {
      setTimeout(() => { 
        quizLevel++; 
        currentBeat = 0;
      }, 1000);
    } else {
      // 全部通关
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

// 节拍挑战逻辑
function runBeatQuizMode() {
  let targetBeat = beatLevels[quizLevel];
  let now = millis();
  
  if (now - lastBeatTime > beatInterval) {
    lastBeatTime = now;
    currentBeat = (currentBeat % targetBeat) + 1;
    handleBeatSensory(currentBeat, targetBeat);
  }

  drawBeatVisuals(currentBeat, targetBeat);
  
  // 界面提示
  fill(255); textAlign(CENTER); textSize(18);
  text("正在播放节拍动画，请听并感受震动后选择：", width/2, 80);
  text("当前关卡: " + (quizLevel + 1) + "/3", width/2, height - 50);
}

function handleBeatSensory(beat, type) {
  // 1. 声音：强拍沉闷，弱拍清脆
  filter.freq(beat === 1 ? 400 : 1500);
  noise.amp(0.6, 0); noise.amp(0, 0.1);

  // 2. 触觉：强拍长振(200ms)，次强中振(100ms)，弱拍短振(50ms) [cite: 9]
  if (window.navigator.vibrate) {
    if (beat === 1) window.navigator.vibrate(200);
    else if (type === 4 && beat === 3) window.navigator.vibrate(100);
    else window.navigator.vibrate(50);
  }
}

function drawBeatVisuals(beat, type) {
  let centerX = width / 2;
  let centerY = height / 2;
  noStroke();

  if (type === 2) {
    // 2/4 拍：两个光点交替，强拍大而亮 [cite: 5]
    for (let i = 1; i <= 2; i++) {
      let isCur = (beat === i);
      fill(isCur ? (i === 1 ? 0 : 210) : 255, 80, isCur ? 100 : 15);
      ellipse(centerX + (i === 1 ? -80 : 80), centerY, isCur && i === 1 ? 120 : 80);
    }
  } else if (type === 3) {
    // 3/4 拍：三个光点画圆，强拍在顶部 [cite: 6]
    for (let i = 1; i <= 3; i++) {
      let ang = -HALF_PI + (TWO_PI / 3) * (i - 1);
      let isCur = (beat === i);
      fill(isCur ? 50 : 255, 80, isCur ? 100 : 15);
      ellipse(centerX + cos(ang)*120, centerY + sin(ang)*120, isCur && i === 1 ? 100 : 70);
    }
  } else if (type === 4) {
    // 4/4 拍：依次点亮，红(强)黄(次强)蓝(弱) [cite: 7]
    for (let i = 1; i <= 4; i++) {
      let isCur = (beat === i);
      let h = (i === 1) ? 0 : (i === 3 ? 50 : 210);
      fill(h, 80, isCur ? 100 : 15);
      ellipse(centerX - 150 + (i-1)*100, centerY, isCur ? 90 : 60);
    }
  }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
