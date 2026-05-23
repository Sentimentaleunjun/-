const passages = {
  daily: [
    "좋은 문장은 천천히 읽을 때 더 선명해진다. 오늘의 속도보다 중요한 것은 손끝에 남는 리듬이다.",
    "작은 친절은 오래 남는다. 마음을 다해 건넨 말 한마디가 하루의 방향을 바꾸기도 한다.",
    "창문을 조금 열어 두면 바람이 먼저 들어오고, 그다음에는 새롭게 시작할 마음이 따라온다.",
    "완벽한 준비보다 가벼운 시작이 더 멀리 데려다줄 때가 있다. 지금 치는 한 글자가 첫걸음이다."
  ],
  focus: [
    "집중은 조용한 힘이다. 눈앞의 한 줄을 또렷하게 바라보고, 틀린 글자는 차분히 다시 맞추면 된다.",
    "속도를 높이려면 먼저 흔들림을 줄여야 한다. 정확한 입력이 쌓이면 빠른 손놀림은 자연스럽게 따라온다.",
    "결과는 숫자로 남지만 실력은 과정에 남는다. 오늘의 기록은 다음 기록을 위한 따뜻한 기준이 된다.",
    "한 번의 실수에 멈추지 말고 문장의 끝까지 가 보자. 끝까지 간 사람만이 다음 시작을 가볍게 만든다."
  ],
  tech: [
    "좋은 인터페이스는 사용자를 기다리게 하지 않는다. 필요한 정보는 가까이에 있고, 선택은 분명하게 보여야 한다.",
    "서버는 단순하게, 화면은 빠르게, 기록은 사용자의 브라우저 안에만 남긴다. 작은 구조가 오래 가는 서비스를 만든다.",
    "배포 환경에서는 헬스 체크가 중요하다. 짧은 응답 하나가 서비스의 현재 상태를 가장 간결하게 알려 준다.",
    "코드는 읽히기 위해 존재한다. 이름은 의도를 담고, 함수는 한 가지 일을 또렷하게 끝내야 한다."
  ]
};

const state = {
  category: "daily",
  duration: 30,
  startedAt: null,
  timerId: null,
  remaining: 30,
  finished: false,
  currentPassage: "",
  lastIndex: -1
};

const storageKey = "seowootype-results";

const elements = {
  categorySelect: document.querySelector("#categorySelect"),
  timeButtons: document.querySelectorAll(".time-option"),
  newTextButton: document.querySelector("#newTextButton"),
  targetText: document.querySelector("#targetText"),
  typingInput: document.querySelector("#typingInput"),
  restartButton: document.querySelector("#restartButton"),
  finishButton: document.querySelector("#finishButton"),
  timeLeft: document.querySelector("#timeLeft"),
  progressBar: document.querySelector("#progressBar"),
  progressText: document.querySelector("#progressText"),
  cpmStat: document.querySelector("#cpmStat"),
  accuracyStat: document.querySelector("#accuracyStat"),
  mistakeStat: document.querySelector("#mistakeStat"),
  bestStat: document.querySelector("#bestStat"),
  resultPanel: document.querySelector("#resultPanel"),
  resultTitle: document.querySelector("#resultTitle"),
  resultCpm: document.querySelector("#resultCpm"),
  resultAccuracy: document.querySelector("#resultAccuracy"),
  resultMistakes: document.querySelector("#resultMistakes"),
  resultTyped: document.querySelector("#resultTyped"),
  historyList: document.querySelector("#historyList"),
  clearHistoryButton: document.querySelector("#clearHistoryButton")
};

function getPool() {
  if (state.category === "mixed") {
    return Object.values(passages).flat();
  }

  return passages[state.category];
}

function pickPassage() {
  const pool = getPool();
  let nextIndex = Math.floor(Math.random() * pool.length);

  if (pool.length > 1) {
    while (nextIndex === state.lastIndex) {
      nextIndex = Math.floor(Math.random() * pool.length);
    }
  }

  state.lastIndex = nextIndex;
  state.currentPassage = pool[nextIndex];
}

function toChars(text) {
  return Array.from(text);
}

function calculateMetrics() {
  const targetChars = toChars(state.currentPassage);
  const typedChars = toChars(elements.typingInput.value);
  const typedCount = typedChars.length;
  let correct = 0;
  let mistakes = 0;

  typedChars.forEach((char, index) => {
    if (char === targetChars[index]) {
      correct += 1;
    } else {
      mistakes += 1;
    }
  });

  const elapsedMs = state.startedAt ? Date.now() - state.startedAt : 0;
  const elapsedMinutes = Math.max(elapsedMs / 60000, 1 / 60);
  const cpm = Math.round(correct / elapsedMinutes);
  const accuracy = typedCount === 0 ? 100 : Math.max(0, Math.round((correct / typedCount) * 100));
  const progress = Math.min(100, Math.round((typedCount / targetChars.length) * 100));

  return {
    accuracy,
    correct,
    cpm: state.startedAt ? cpm : 0,
    mistakes,
    progress,
    targetCount: targetChars.length,
    typedCount
  };
}

function renderTarget() {
  const targetChars = toChars(state.currentPassage);
  const typedChars = toChars(elements.typingInput.value);
  const fragment = document.createDocumentFragment();

  targetChars.forEach((char, index) => {
    const span = document.createElement("span");
    const typedChar = typedChars[index];
    span.textContent = char === " " ? "\u00a0" : char;

    if (typedChar !== undefined) {
      span.classList.add(typedChar === char ? "correct" : "incorrect");
    }

    if (index === typedChars.length && !state.finished) {
      span.classList.add("current");
    }

    fragment.appendChild(span);
  });

  elements.targetText.replaceChildren(fragment);
}

function renderStats() {
  const metrics = calculateMetrics();
  elements.cpmStat.textContent = metrics.cpm;
  elements.accuracyStat.textContent = metrics.accuracy;
  elements.mistakeStat.textContent = metrics.mistakes;
  elements.progressText.textContent = `${metrics.progress}%`;
  elements.progressBar.style.width = `${metrics.progress}%`;
  elements.bestStat.textContent = getBestScore();
}

function renderTime() {
  elements.timeLeft.textContent = state.remaining;
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function writeHistory(results) {
  localStorage.setItem(storageKey, JSON.stringify(results.slice(0, 8)));
}

function getBestScore() {
  const history = readHistory();
  return history.reduce((best, item) => Math.max(best, item.cpm), 0);
}

function renderHistory() {
  const history = readHistory();

  if (history.length === 0) {
    elements.historyList.innerHTML = '<li class="empty-history">아직 기록이 없습니다.</li>';
    return;
  }

  elements.historyList.innerHTML = history
    .map((item) => {
      const date = new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(item.createdAt));

      return `
        <li>
          <span class="history-score">${item.cpm} 타</span>
          <span class="history-meta">${item.accuracy}% 정확도 · ${item.mistakes} 오타 · ${item.duration}초</span>
          <time class="history-meta" datetime="${item.createdAt}">${date}</time>
        </li>
      `;
    })
    .join("");
}

function startTimer() {
  if (state.startedAt || state.finished) {
    return;
  }

  state.startedAt = Date.now();
  state.timerId = window.setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
    state.remaining = Math.max(0, state.duration - elapsedSeconds);
    renderTime();
    renderStats();

    if (state.remaining === 0) {
      finishTest();
    }
  }, 200);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
  }

  state.timerId = null;
}

function resetTest(shouldPickPassage = false) {
  stopTimer();

  if (shouldPickPassage) {
    pickPassage();
  }

  state.startedAt = null;
  state.remaining = state.duration;
  state.finished = false;
  elements.typingInput.value = "";
  elements.typingInput.disabled = false;
  elements.resultPanel.hidden = true;
  renderTarget();
  renderTime();
  renderStats();
  window.requestAnimationFrame(() => elements.typingInput.focus());
}

function finishTest() {
  if (state.finished) {
    return;
  }

  state.finished = true;
  stopTimer();
  elements.typingInput.disabled = true;
  renderTarget();
  renderStats();

  const metrics = calculateMetrics();
  const result = {
    accuracy: metrics.accuracy,
    cpm: metrics.cpm,
    duration: state.duration,
    mistakes: metrics.mistakes,
    typedCount: metrics.typedCount,
    createdAt: new Date().toISOString()
  };

  const history = readHistory();
  writeHistory([result, ...history]);

  elements.resultCpm.textContent = result.cpm;
  elements.resultAccuracy.textContent = result.accuracy;
  elements.resultMistakes.textContent = result.mistakes;
  elements.resultTyped.textContent = result.typedCount;
  elements.resultTitle.textContent = getResultTitle(result);
  elements.resultPanel.hidden = false;
  renderHistory();
  renderStats();
}

function getResultTitle(result) {
  if (result.typedCount === 0) {
    return "다시 가볍게 시작해요";
  }

  if (result.accuracy >= 96 && result.cpm >= 300) {
    return "손끝이 아주 안정적이에요";
  }

  if (result.accuracy >= 92) {
    return "정확도가 좋아요";
  }

  if (result.cpm >= 250) {
    return "속도가 살아 있어요";
  }

  return "좋은 시작이에요";
}

function handleInput() {
  startTimer();

  const typedCount = toChars(elements.typingInput.value).length;
  const targetCount = toChars(state.currentPassage).length;

  renderTarget();
  renderStats();

  if (typedCount >= targetCount) {
    finishTest();
  }
}

elements.typingInput.addEventListener("input", handleInput);

elements.restartButton.addEventListener("click", () => resetTest(false));
elements.finishButton.addEventListener("click", finishTest);
elements.newTextButton.addEventListener("click", () => resetTest(true));

elements.categorySelect.addEventListener("change", (event) => {
  state.category = event.target.value;
  state.lastIndex = -1;
  resetTest(true);
});

elements.timeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    elements.timeButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.duration = Number(button.dataset.duration);
    resetTest(false);
  });
});

elements.clearHistoryButton.addEventListener("click", () => {
  writeHistory([]);
  renderHistory();
  renderStats();
});

pickPassage();
resetTest(false);
renderHistory();
