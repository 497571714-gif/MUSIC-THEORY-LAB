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
let waveAmp = 0;
let errorCount = 0; // 记录错误次数 

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
    errorCount = 0; // 开启挑战时重置错误记录 [cite: 18]
    lastBeatTime = millis();
  }
};

window.submitBeatAnswer = function(ans) {
  let isCorrect = (ans === beatLevels[quizLevel]);
  let isFinished = false;

  if (isCorrect) {
    if (quizLevel < beatLevels.length - 1) {
      setTimeout(() => { 
        quizLevel++; 
        currentBeat = 0;
      }, 1000);
    } else {
      isFinished = true;
      showFinalTitle(); // 挑战结束，结算称号 
    }
    return { isCorrect: true, isFinished: isFinished };
  } else {
    errorCount++; // 记录错误 [cite: 34]
    return { isCorrect: false, isFinished: false };
  }
};

// 称号结算逻辑 
function showFinalTitle() {
  let title = "";
  if (errorCount === 0) {
    title = "✨ 节奏大师 (Perfect!) ✨"; // 0次错误 
  } else if (errorCount === 1) {
    title = "🛡️ 节奏骑士 🛡️"; // 1次错误 
  } else {
    title = "📜 节奏学徒 📜"; // 2次及以上错误 
  }
  
  setTimeout(() => {
    alert("挑战完成！\n本次错误次数: " + errorCount + "\n获得称号: " + title);
    window.setLabMode('pitch'); // 结束后返回音高模式
    document.querySelectorAll('.nav-btn')[0].click(); // 模拟点击切换UI
  }, 500);
}

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

function runBeatQuizMode() {
  let targetBeat = beatLevels[quizLevel];
  let now = millis();
  
  if (now - lastBeatTime > beatInterval) {
    lastBeatTime = now;
    currentBeat = (currentBeat % targetBeat) + 1;
    handleBeatSensory(currentBeat, targetBeat);
    waveAmp = 1.0; 
  }

  waveAmp *= 0.9; 
  drawHeartbeatLine(currentBeat, targetBeat, waveAmp);
  
  fill(255); textAlign(CENTER); textSize(18);
  text("感受心跳线的波动规律并选择：", width/2, 80);
  text("当前关卡: " + (quizLevel + 1) + "/3 | 错误次数: " + errorCount, width/2, height - 50);
}

function handleBeatSensory(beat, type) {
  filter.freq(beat === 1 ? 400 : 1500);
  noise.amp(0.6, 0); noise.amp(0, 0.1);

  if (window.navigator.vibrate) {
    if (beat === 1) window.navigator.vibrate(200); 
    else if (type === 4 && beat === 3) window.navigator.vibrate(100); 
    else window.navigator.vibrate(50); 
  }
}

function drawHeartbeatLine(beat, type, amp) {
  let centerX = width / 2;
  let centerY = height / 2;
  
  let lineHue = 210; 
  let maxJump = 30;  
  
  if (beat === 1) {
    lineHue = 0;      
    maxJump = 150;    
  } else if (type === 4 && beat === 3) {
    lineHue = 120;    
    maxJump = 80;     
  }

  stroke(lineHue, 80, 100);
  strokeWeight(4);
  noFill();
  
  beginShape();
  for (let x = 0; x < width; x += 5) {
    let distToCenter = abs(x - centerX);
    let peak = 0;
    if (distToCenter < 100) {
      peak = sin(map(distToCenter, 0, 100, 0, PI * 2)) * maxJump * amp;
    }
    let y = centerY + peak + sin(x * 0.05 + frameCount * 0.2) * 5;
    vertex(x, y);
  }
  endShape();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
