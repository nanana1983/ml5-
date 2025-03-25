let video;
let handPose;
let hands = [];
let isDetecting = true;
let connections = [];

function preload() {
  // HandPose 모델 로딩 (옵션 포함)
  handPose = ml5.handPose({
    maxHands: 2,
    flipped: false,
    runtime: 'tfjs',
    modelType: 'full',
    detectorModelUrl: undefined,
    landmarkModelUrl: undefined
  });
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  handPose.detectStart(video, gotHands);

  // 키포인트 연결 정보 가져오기
  connections = handPose.getConnections();
}

function draw() {
  image(video, 0, 0, width, height);

  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];

    // 🔴 골격 연결 그리기
    for (let j = 0; j < connections.length; j++) {
      const [startIdx, endIdx] = connections[j];
      const start = hand.keypoints[startIdx];
      const end = hand.keypoints[endIdx];

      stroke(255, 0, 0);
      strokeWeight(2);
      line(start.x, start.y, end.x, end.y);
    }

    // 🟢 키포인트 점 + 숫자 라벨
    for (let j = 0; j < hand.keypoints.length; j++) {
      const keypoint = hand.keypoints[j];

      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 10);

      fill(255);
      textSize(12);
      textAlign(CENTER, CENTER);
      text(j, keypoint.x, keypoint.y - 12);
    }
  }
}

// 콜백 함수: 손 감지 결과 저장
function gotHands(results) {
  hands = results;
}

// 🖱️ 마우스 클릭 시 감지 ON/OFF 전환
function mousePressed() {
  toggleDetection();
}

function toggleDetection() {
  if (isDetecting) {
    handPose.detectStop();  // 감지 중지
    isDetecting = false;
    console.log("손 감지 중지됨");
  } else {
    handPose.detectStart(video, gotHands); // 감지 시작
    isDetecting = true;
    console.log("손 감지 시작됨");
  }
}
