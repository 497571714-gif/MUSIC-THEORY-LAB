let currentMode = 'pitch';
let isStarted = false;
let osc, envelope, noise, filter;
let trails = [];

const majorScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

let quizLevel = 0; 
let beatLevels = [2, 3, 4];
let currentBeat = 0;
let lastBeatTime = 0;
let bpm = 80;
let beatInterval = 60000 / bpm;
let waveAmp = 0;
let beatErrorCount = 0;

let volLevel = 0; 
let volSequence = [0, 2, 1, 3]; 
let volErrorCount = 0;
let ripples = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1); // 开启 alpha 通道
  
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
    quizLevel = 0; currentBeat = 0; beatErrorCount = 0;
    lastBeatTime = millis();
  } else if (m === 'volume') {
    volLevel = 0; volErrorCount = 0; ripples = [];
    lastBeatTime = millis();
  }
};

window.submitBeatAnswer = function(ans) {
  let isCorrect = (ans === beatLevels[quizLevel]);
  if (isCorrect) {
    if (quizLevel < beatLevels.length - 1) {
      setTimeout(() => { quizLevel++; currentBeat = 0; }, 1000);
    } else {
      showFinalBeatTitle();
    }
    return { isCorrect: true, isFinished: quizLevel >= beatLevels.length - 1 };
  } else {
    beatErrorCount++;
    return { isCorrect: false, isFinished: false };
  }
};

window.submitVolumeAnswer = function(ans) {
  let isCorrect = (ans === volSequence[volLevel]);
  if (isCorrect) {
    if (volLevel < volSequence.length - 1) {
      setTimeout(() => { volLevel++; ripples = []; }, 1000);
    } else {
      showFinalVolumeTitle();
    }
    return { isCorrect: true, isFinished: volLevel >= volSequence.length - 1 };
  } else {
    volErrorCount++;
    return { isCorrect: false, isFinished: false };
  }
};

function showFinalBeatTitle() {
  let t = beatErrorCount === 0 ? "✨ 节奏大师 ✨" : (beatErrorCount === 1 ? "🛡️ 节奏骑士 🛡️" : "📜 节奏学徒 📜");
  alert("挑战完成！获得称号: " + t);
}

function showFinalVolumeTitle() {
  let msg = volErrorCount === 0 ? "🏆 获得称号：光影指挥家 🏆" : "挑战完成！继续加油感受力度变化吧。";
  alert(msg);
}

function draw() {
  if (!isStarted) return;
  background(0, 0, 5);

  if (currentMode === 'pitch') {
    runPitchMode();
  } else if (currentMode === 'beat') {
    runBeatQuizMode();
  } else if (currentMode === 'volume') {
    runVolumeQuizMode();
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
    noStroke(); fill(hueValue, 80, 100, 0.6); ellipse(mouseX, mouseY, 50);
  }
  for (let t of trails) { fill(t.h, 70, 80, 0.4); ellipse(t.x, t.y, 10); }
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
}

function handleBeatSensory(beat, type) {
  filter.freq(beat === 1 ? 400 : 1500);
  noise.amp(0.6, 0); noise.amp(0, 0.1);
  if (window.navigator.vibrate) {
    let d = (beat === 1) ? 200 : ((type === 4 && beat === 3) ? 100 : 50);
    window.navigator.vibrate(d);
  }
}

function drawHeartbeatLine(beat, type, amp) {
  let centerX = width/2, centerY = height/2;
  let h = (beat === 1) ? 0 : ((type === 4 && beat === 3) ? 120 : 210);
  let j = (beat === 1) ? 150 : ((type === 4 && beat === 3) ? 80 : 30);
  stroke(h, 80, 100); strokeWeight(4); noFill();
  beginShape();
  for (let x = 0; x < width; x += 5) {
    let d = abs(x - centerX);
    let peak = d < 100 ? sin(map(d, 0, 100, 0, PI * 2)) * j * amp : 0;
    vertex(x, centerY + peak + sin(x * 0.05 + frameCount * 0.2) * 5);
  }
  endShape();
}

function runVolumeQuizMode() {
  let targetVol = volSequence[volLevel]; 
  let now = millis();
  
  if (now - lastBeatTime > 1800) {
    lastBeatTime = now;
    let baseR = [40, 70, 120, 180][targetVol];
    let waveS = [1, 1.8, 3.5, 6][targetVol];
    let bright = [40, 60, 85, 100][targetVol];
    let vib = [20, 60, 120, 250][targetVol];
    // 鲜明浅色系：蓝(210), 绿(120), 黄(50), 红(0)
    let hue = [210, 120, 50, 0][targetVol];
    
    ripples.push({ r: baseR, maxR: baseR * 4, s: waveS, b: bright, h: hue, a: 0.6 });
    if (window.navigator.vibrate) window.navigator.vibrate(vib);
    
    osc.freq(440);
    osc.amp([0.1, 0.3, 0.6, 1.0][targetVol], 0.1);
    osc.amp(0, 0.6);
  }

  for (let i = ripples.length - 1; i >= 0; i--) {
    let r = ripples[i];
    
    // 渲染柔软的多层光晕
    noStroke();
    for(let layer = 3; layer > 0; layer--) {
      fill(r.h, 65, r.b, (r.a / layer) * 0.4); 
      ellipse(width/2, height/2, r.r * (1 + layer * 0.2));
    }
    
    // 核心扩散圆
    fill(r.h, 75, r.b, r.a);
    ellipse(width/2, height/2, r.r);
    
    r.r += r.s;
    r.a -= 0.01;
    if (r.a <= 0) ripples.splice(i, 1);
  }

  fill(255); textAlign(CENTER); textSize(18);
  text("观察柔软光晕的色调与扩散速度，判断力度标记：", width/2, 80);
  text("当前题目: " + (volLevel + 1) + "/4 | 错误: " + volErrorCount, width/2, height - 50);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
