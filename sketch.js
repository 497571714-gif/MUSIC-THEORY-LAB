let mode = 'pitch';
let osc, envelope;
let majorScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C大调音阶 
let trails = [];
let isStarted = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  
  // 初始化声音发生器
  osc = new p5.Oscillator('sine');
  envelope = new p5.Envelope();
  envelope.setADSR(0.05, 0.1, 0.5, 1); // 设置音量包络，使其听起来像琴键
  envelope.setRange(0.8, 0);
}

function startLab() {
  userStartAudio(); // 激活浏览器音频权限
  osc.start();
  osc.amp(0); 
  document.getElementById('start-screen').style.display = 'none';
  isStarted = true;
}

function draw() {
  if (!isStarted) return;
  background(0, 0, 5);
  
  // 顶部 UI 逻辑已在 HTML 中定义
  if (mode === 'pitch') {
    handlePitchMode();
  }
  // ... 其他模式保持不变
}

function handlePitchMode() {
  // 1. 计算音高映射 [cite: 26, 27]
  // 将屏幕高度分为 8 个区域，对应大调音阶的 8 个音
  let step = height / majorScale.length;
  let index = floor(map(mouseY, height, 0, 0, majorScale.length));
  index = constrain(index, 0, majorScale.length - 1);
  
  let currentFreq = majorScale[index];
  let hueValue = map(index, 0, majorScale.length - 1, 240, 0); // 蓝到红 

  if (mouseIsPressed) {
    // 2. 声音呈现：播放对应音阶频率
    osc.freq(currentFreq);
    envelope.play(osc);
    
    // 3. 视觉呈现：记录轨迹 [cite: 27, 29]
    trails.push({x: mouseX, y: mouseY, h: hueValue});
    
    // 绘制当前点击的光晕 [cite: 11]
    noStroke();
    fill(hueValue, 80, 100, 0.5);
    ellipse(mouseX, mouseY, 60);
  }

  // 绘制“旋律画廊” [cite: 29]
  for (let p of trails) {
    fill(p.h, 70, 80, 0.4);
    ellipse(p.x, p.y, 15);
  }
}

function setMode(m) {
  mode = m;
  trails = [];
  document.getElementById('title').innerText = m === 'pitch' ? "音高感官实验" : "其他实验";
}
