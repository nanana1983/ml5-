let video; // 웹캠 영상 객체
let handPose; // ml5의 handPose 모델 객체
let hands = []; // 감지된 손 데이터를 저장할 배열
let painting; // 그림을 그릴 그래픽 레이어
let px = 0; // 이전 x 좌표
let py = 0; // 이전 y 좌표
let sw = 8; // 선의 두께 (손가락 간 거리로 결정)

let emojiFalling = false; // 이모지가 떨어지는 애니메이션 활성화 여부
let emojiStartTime = 0; // 이모지 애니메이션 시작 시간
let emojiArray = []; // 현재 떨어지고 있는 이모지 객체들
let showText = false; // 텍스트 메시지 표시 여부
let textContent = ""; // 표시할 텍스트 내용

let toolMode = "연필"; // 현재 도구 모드 ("연필" 또는 "지우개")
let lastToolToggleTime = 0; // 마지막 도구 변경 시간

function preload() {
  handPose = ml5.handPose({ flipped: true }); // 손 모델 불러오기 (좌우 반전 설정)
}

function mousePressed() {
  console.log(hands); // 디버깅용으로 감지된 손 정보 출력
}

function gotHands(results) {
  hands = results; // 감지된 손 데이터를 저장
}

function setup() {
  createCanvas(640, 480); // 기본 캔버스 생성
  painting = createGraphics(640, 480); // 그림용 별도 레이어 생성
  painting.clear(); // 그림 레이어 초기화 (투명하게)

  video = createCapture(VIDEO, { flipped: true }); // 웹캠 영상 받아오기 (좌우 반전)
  video.size(640, 480); // 영상 사이즈 설정
  video.hide(); // 웹캠 영상 DOM 요소 숨기기

  handPose.detectStart(video, gotHands); // 영상에서 손 감지 시작
}
function draw() {
  image(video, 0, 0); // 웹캠 영상을 캔버스 배경에 표시

  // ▶ 왼쪽 버튼 박스 설정 (동의, 이의, 제안, 좋아요)
  let rectWidth = 80;         // 버튼 너비
  let rectHeight = 100;       // 버튼 높이
  let rectX = 10;             // 버튼의 X 위치 (왼쪽 끝)

  // 각 버튼의 색상 (하늘색, 남색, 보라, 검정)
  let rectColors = [
    [135, 206, 235],
    [0, 0, 150],
    [128, 0, 128],
    [0, 0, 0]
  ];

  // 버튼 텍스트 라벨
  let labels = ["동의", "이의", "제안", "좋아요"];

  textAlign(CENTER, CENTER); // 텍스트를 정중앙에 정렬
  textSize(16);              // 텍스트 크기 설정

  // 4개의 버튼을 반복문으로 출력
  for (let i = 0; i < 4; i++) {
    let [r, g, b] = rectColors[i];  // 색상 값 추출
    let y = 10 + i * (rectHeight + 10); // 각 버튼의 Y 위치 계산

    fill(r, g, b);      // 버튼 색상 설정
    noStroke();         // 테두리 없음
    rect(rectX, y, rectWidth, rectHeight, 10); // 버튼 그리기 (모서리 둥글게)

    fill(255);          // 텍스트 색 흰색
    text(labels[i], rectX + rectWidth / 2, y + rectHeight / 2); // 버튼 중앙에 텍스트
  }

  // ▶ 오른쪽 도구 토글 버튼 ("연필" 또는 "지우개")
  let toolBoxX = width - 120;   // 오른쪽 위치
  let toolBoxY = 80;            // Y 위치
  let toolBoxW = 100;           // 너비
  let toolBoxH = 50;            // 높이

  fill(255);                   // 흰색 배경
  stroke(180);                 // 테두리 회색
  strokeWeight(1);             // 테두리 두께
  rect(toolBoxX, toolBoxY, toolBoxW, toolBoxH, 10); // 도구 박스 그리기

  fill(0);                     // 글자 색 검정
  textSize(16);
  textAlign(CENTER, CENTER);   // 가운데 정렬
  text(toolMode, toolBoxX + toolBoxW / 2, toolBoxY + toolBoxH / 2); // 현재 도구 모드 표시

  // ▶ 손의 위치 변수 초기화
  let rightHand = null;
  let leftHand = null;

  // 손이 감지되었을 때
  if (hands.length > 0) {
    for (let hand of hands) {
      // 오른손이면
      if (hand.handedness === 'Right') {
        rightHand = {
          index: hand.index_finger_tip,
          thumb: hand.thumb_tip
        };
      }
      // 왼손이면
      else if (hand.handedness === 'Left') {
        leftHand = {
          index: hand.index_finger_tip,
          thumb: hand.thumb_tip
        };
      }
    }

    // ▶ 양손 검지가 가까우면 그림판 초기화
    if (rightHand && leftHand) {
      let d = dist(
        rightHand.index.x, rightHand.index.y,
        leftHand.index.x, leftHand.index.y
      );
      if (d < 30) {
        painting.clear(); // 그림판 초기화
      }
    }

    // ▶ 왼손 제스처로 버튼 터치 인식
    if (leftHand) {
      let { index, thumb } = leftHand;
      let x = (index.x + thumb.x) * 0.5; // 엄지와 검지 중간 지점 x
      let y = (index.y + thumb.y) * 0.5; // 중간 지점 y
      sw = dist(index.x, index.y, thumb.x, thumb.y); // 선 굵기 결정

      fill(255);
      noStroke();
      circle(x, y, sw); // 현재 왼손 위치에 원 표시

      // 각 버튼의 Y 범위
      let btnY = [10, 120, 230, 340];

      // 각 버튼에 대응하는 텍스트 및 이모지
      let messages = ["동의합니다.", "이의 있습니다.", "추가로 제안드리고 싶습니다.", "추가로 의견 주셔서 감사합니다."];
      let emojis = ["👍", "🙋", "😄", "💖"];

      // 터치 감지
      for (let i = 0; i < btnY.length; i++) {
        if (
          x > rectX && x < rectX + rectWidth &&
          y > btnY[i] && y < btnY[i] + rectHeight &&
          !emojiFalling // 이미 이모지가 떨어지고 있는 중이면 무시
        ) {
          startEmojiEffect(emojis[i], messages[i]); // 이모지 효과 실행
        }
      }
    }

    // ▶ 오른손 제스처로 그림 그리기 or 도구 변경
    if (rightHand) {
      let { index, thumb } = rightHand;
      let x = (index.x + thumb.x) * 0.5;
      let y = (index.y + thumb.y) * 0.5;
      let d = dist(index.x, index.y, thumb.x, thumb.y); // 엄지-검지 거리

      // 도구 토글 버튼 클릭 감지
      if (
        x > toolBoxX && x < toolBoxX + toolBoxW &&
        y > toolBoxY && y < toolBoxY + toolBoxH &&
        d < 20 && millis() - lastToolToggleTime > 500
      ) {
        toolMode = (toolMode === "연필") ? "지우개" : "연필"; // 도구 변경
        lastToolToggleTime = millis(); // 마지막 변경 시간 저장
      }

      // ▶ 연필 모드일 때 그리기
      if (toolMode === "연필" && d < 20) {
        painting.stroke(0, 0, 150);           // 파란색 선
        painting.strokeWeight(sw * 0.5);      // 손가락 거리 기반 굵기
        painting.line(px, py, x, y);          // 이전 점 → 현재 점 선 긋기
      }

      // ▶ 지우개 모드일 때 지우기
      else if (toolMode === "지우개" && d < 20) {
        painting.erase();                     // 지우기 모드 ON
        painting.strokeWeight(30);            // 굵게
        painting.line(px, py, x, y);          // 지우기
        painting.noErase();                   // 지우기 모드 OFF
      }

      px = x; // 이전 x 위치 저장
      py = y; // 이전 y 위치 저장
    }
  }

  // ▶ 그림 레이어를 영상 위에 출력
  image(painting, 0, 0);

  // ▶ 이모지 애니메이션 실행 중일 때
  if (emojiFalling) {
    for (let emoji of emojiArray) {
      emoji.y += emoji.speed; // 아래로 이동
      textSize(48);
      textAlign(CENTER);
      text(emoji.char, emoji.x, emoji.y); // 이모지 출력
    }

    // 5초가 지나면 애니메이션 종료
    if (millis() - emojiStartTime > 5000) {
      emojiFalling = false;
      showText = false;
      emojiArray = []; // 초기화
    }
  }

  // ▶ 텍스트 메시지 출력
  if (showText) {
    fill(255);
    textSize(24);
    textAlign(RIGHT, BOTTOM);
    text(textContent, width - 20, height - 20); // 오른쪽 아래에 메시지 출력
  }
}

// 📦 이모지 효과 시작 함수
function startEmojiEffect(emojiChar, displayText) {
  emojiFalling = true;             // 이모지 애니메이션 시작
  showText = true;                 // 텍스트 표시 ON
  textContent = displayText;       // 표시할 메시지 저장
  emojiStartTime = millis();       // 시작 시간 저장
  emojiArray = [];                 // 이모지 배열 초기화

  // 여러 개의 이모지를 만들어 배열에 추가
  for (let i = 0; i < 12; i++) {
    emojiArray.push({
      x: random(width / 2 - 100, width / 2 + 100), // 중간 근처 x 위치
      y: random(-100, 0),                          // 화면 위에서 시작
      speed: random(1, 3),                         // 떨어지는 속도 랜덤
      char: emojiChar                              // 이모지 문자
    });
  }
}
