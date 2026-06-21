let tasks = [];
let filteredTasks = [];
let currentTask = 0;
let currentSubject = "all";
let currentTopic = "all";
let currentEge = "all";
let currentDifficulty = "all";

let solvedTasks = JSON.parse(localStorage.getItem("solvedTasks") || "[]");
let stats = JSON.parse(
  localStorage.getItem("egeAiStats") ||
  '{"solved":0,"correct":0,"wrong":0,"bySubject":{},"byTopic":{}}'
);

const SUBJECT_META = {
  "Математика профиль": "📐",
  "Математика база": "📘",
  "Русский язык": "🇷🇺",
  "Обществознание": "⚖️",
  "Физика": "⚡",
  "Информатика": "💻",
  "Английский язык": "🇬🇧",
  "История": "🏛️",
  "География": "🌍",
  "Биология": "🧬",
  "Химия": "⚗️",
  "Литература": "📖"
};

function saveStats() {
  localStorage.setItem("egeAiStats", JSON.stringify(stats));
}

function saveSolvedTasks() {
  localStorage.setItem("solvedTasks", JSON.stringify(solvedTasks));
}

function resetStats() {
  stats = { solved: 0, correct: 0, wrong: 0, bySubject: {}, byTopic: {} };
  solvedTasks = [];

  saveStats();
  saveSolvedTasks();
  applyFilters();
  renderSubjectCards();
  updateStatsUI();
}

function accuracy(correct, solved) {
  if (!solved) return 0;
  return Math.round((correct / solved) * 100);
}

function markTaskAsSolved(task) {
  if (!task || !task.id) return;

  if (!solvedTasks.includes(task.id)) {
    solvedTasks.push(task.id);
    saveSolvedTasks();
  }
}

function registerAnswer(isCorrect, task) {
  stats.solved += 1;

  if (isCorrect) stats.correct += 1;
  else stats.wrong += 1;

  if (!stats.bySubject[task.subject]) {
    stats.bySubject[task.subject] = { solved: 0, correct: 0, wrong: 0 };
  }

  stats.bySubject[task.subject].solved += 1;

  if (isCorrect) stats.bySubject[task.subject].correct += 1;
  else stats.bySubject[task.subject].wrong += 1;

  const topicKey = task.subject + " — " + task.topic;

  if (!stats.byTopic[topicKey]) {
    stats.byTopic[topicKey] = { solved: 0, correct: 0, wrong: 0 };
  }

  stats.byTopic[topicKey].solved += 1;

  if (isCorrect) stats.byTopic[topicKey].correct += 1;
  else stats.byTopic[topicKey].wrong += 1;

  saveStats();
  updateStatsUI();
}

function weakestTopic() {
  let worst = null;
  let worstAccuracy = 101;

  Object.keys(stats.byTopic).forEach(function (topic) {
    const item = stats.byTopic[topic];
    if (item.solved < 2) return;

    const acc = accuracy(item.correct, item.solved);

    if (acc < worstAccuracy) {
      worstAccuracy = acc;
      worst = topic;
    }
  });

  if (!worst) return "Пока мало данных";
  return worst + " — " + worstAccuracy + "%";
}

function updateStatsUI() {
  const solved = document.getElementById("statSolved");
  const correct = document.getElementById("statCorrect");
  const wrong = document.getElementById("statWrong");
  const acc = document.getElementById("statAccuracy");
  const weak = document.getElementById("statWeakTopic");
  const list = document.getElementById("subjectStatsList");

  if (solved) solved.textContent = stats.solved;
  if (correct) correct.textContent = stats.correct;
  if (wrong) wrong.textContent = stats.wrong;
  if (acc) acc.textContent = accuracy(stats.correct, stats.solved) + "%";
  if (weak) weak.textContent = weakestTopic();

  if (list) {
    list.innerHTML = "";

    const subjects = Object.keys(stats.bySubject);

    if (subjects.length === 0) {
      list.innerHTML = "<p class='muted'>Реши несколько заданий, и здесь появится статистика по предметам.</p>";
      return;
    }

    subjects.forEach(function (subject) {
      const item = stats.bySubject[subject];

      const div = document.createElement("div");
      div.className = "subject-stat";
      div.innerHTML =
        "<b>" + subject + "</b>" +
        "<span>Решено: " + item.solved + "</span>" +
        "<span>Верно: " + item.correct + "</span>" +
        "<span>Точность: " + accuracy(item.correct, item.solved) + "%</span>";

      list.appendChild(div);
    });
  }
}

function openApp() {
  const landing = document.getElementById("landing");
  const app = document.getElementById("app");

  if (landing) landing.style.display = "none";
  if (app) app.classList.remove("hidden");

  window.scrollTo(0, 0);
}

function openPage(pageId) {
  document.querySelectorAll(".nav").forEach(function (item) {
    item.classList.remove("active");
    if (item.dataset.page === pageId) item.classList.add("active");
  });

  document.querySelectorAll(".page").forEach(function (page) {
    page.classList.remove("active");
  });

  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");

  const title = document.getElementById("pageTitle");

  if (title) {
    const names = {
      home: "Главная",
      subjects: "Предметы",
      plan: "План подготовки",
      tasks: "Задания",
      tests: "Пробники",
      stats: "Статистика",
      tutor: "AI-репетитор"
    };

    title.textContent = names[pageId] || "EGE AI";
  }

  if (pageId === "subjects") renderSubjectCards();
  updateStatsUI();
}

function setupNavigation() {
  document.querySelectorAll(".nav").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openPage(btn.dataset.page);
    });
  });
}

function uniqueValues(field, source) {
  return [...new Set(source.map(function (task) {
    return task[field];
  }).filter(Boolean))];
}

function fillSelect(id, values, firstText) {
  const select = document.getElementById(id);
  if (!select) return;

  select.innerHTML = "";

  const first = document.createElement("option");
  first.value = "all";
  first.textContent = firstText;
  select.appendChild(first);

  values.forEach(function (value) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function populateFilters() {
  fillSelect("subjectFilter", uniqueValues("subject", tasks), "Все предметы");
  updateDependentFilters();
}

function updateDependentFilters() {
  const source = currentSubject === "all"
    ? tasks
    : tasks.filter(function (task) {
        return task.subject === currentSubject;
      });

  fillSelect("topicFilter", uniqueValues("topic", source), "Все темы");
  fillSelect("egeFilter", uniqueValues("egeNumber", source), "Все номера ЕГЭ");
  fillSelect("difficultyFilter", uniqueValues("difficulty", source), "Любая сложность");
}

function applyFilters() {
  const subjectFilter = document.getElementById("subjectFilter");
  const topicFilter = document.getElementById("topicFilter");
  const egeFilter = document.getElementById("egeFilter");
  const difficultyFilter = document.getElementById("difficultyFilter");

  const oldSubject = currentSubject;

  currentSubject = subjectFilter ? subjectFilter.value : "all";

  if (oldSubject !== currentSubject) {
    currentTopic = "all";
    currentEge = "all";
    currentDifficulty = "all";

    updateDependentFilters();

    if (topicFilter) topicFilter.value = "all";
    if (egeFilter) egeFilter.value = "all";
    if (difficultyFilter) difficultyFilter.value = "all";
  } else {
    currentTopic = topicFilter ? topicFilter.value : "all";
    currentEge = egeFilter ? egeFilter.value : "all";
    currentDifficulty = difficultyFilter ? difficultyFilter.value : "all";
  }

  filteredTasks = tasks.filter(function (task) {
    const subjectMatch = currentSubject === "all" || task.subject === currentSubject;
    const topicMatch = currentTopic === "all" || task.topic === currentTopic;
    const egeMatch = currentEge === "all" || task.egeNumber === currentEge;
    const difficultyMatch = currentDifficulty === "all" || task.difficulty === currentDifficulty;
    const notSolved = !solvedTasks.includes(task.id);

    return subjectMatch && topicMatch && egeMatch && difficultyMatch && notSolved;
  });

  currentTask = 0;

  updateTaskCount();
  renderTask();
}

async function loadTasks() {
  try {
    const response = await fetch("tasks.json");
    tasks = await response.json();

    filteredTasks = tasks.filter(function (task) {
      return !solvedTasks.includes(task.id);
    });

    populateFilters();
    renderSubjectCards();

    if (filteredTasks.length > 0) {
      currentTask = Math.floor(Math.random() * filteredTasks.length);
    }

    updateTaskCount();
    renderTask();
  } catch (error) {
    console.error("Не удалось загрузить tasks.json", error);

    tasks = [];
    filteredTasks = [];

    renderTask();
    renderSubjectCards();
  }
}

function updateTaskCount() {
  const el = document.getElementById("taskCount");
  if (!el) return;

  el.textContent =
    "Найдено заданий: " + filteredTasks.length +
    " · Уже решено: " + solvedTasks.length;
}

function renderTask() {
  const taskTitle = document.getElementById("taskTitle");
  const taskMeta = document.getElementById("taskMeta");
  const taskDifficulty = document.getElementById("taskDifficulty");
  const taskQuestion = document.getElementById("taskQuestion");
  const answerInput = document.getElementById("answer");
  const result = document.getElementById("result");

  if (!taskTitle || !taskMeta || !taskQuestion || !answerInput || !result) return;

  if (!filteredTasks || filteredTasks.length === 0) {
    taskTitle.textContent = "Заданий не найдено";
    taskMeta.textContent = "Все задания по этим фильтрам уже решены";
    if (taskDifficulty) taskDifficulty.textContent = "";
    taskQuestion.textContent = "Выбери другие фильтры или сбрось статистику.";
    answerInput.value = "";
    result.textContent = "";
    updateTaskCount();
    return;
  }

  const task = filteredTasks[currentTask];

  taskTitle.textContent = task.title || "Задание";
  taskMeta.textContent = (task.subject || "") + " · " + (task.topic || "") + " · " + (task.egeNumber || "");

  if (taskDifficulty) taskDifficulty.textContent = task.difficulty || "";

  taskQuestion.textContent = task.question || "";
  answerInput.value = "";
  result.textContent = "";

  updateTaskCount();
}

function checkAnswer() {
  if (!filteredTasks || filteredTasks.length === 0) return;

  const task = filteredTasks[currentTask];
  const answerInput = document.getElementById("answer");
  const result = document.getElementById("result");

  if (!answerInput || !result) return;

  const value = answerInput.value.trim().toLowerCase().replace(",", ".");
  const correct = String(task.answer).trim().toLowerCase().replace(",", ".");

  if (value === correct) {
    result.style.color = "#00d26a";
    result.textContent = "Верно! " + task.explanation;
    registerAnswer(true, task);
    markTaskAsSolved(task);
  } else {
    result.style.color = "#ff5a5a";
    result.textContent = "Пока неверно. " + task.explanation;
    registerAnswer(false, task);
  }

  updateTaskCount();
  renderSubjectCards();
}

function nextTask() {
  applyFilters();

  if (!filteredTasks || filteredTasks.length === 0) {
    renderTask();
    return;
  }

  if (filteredTasks.length === 1) {
    currentTask = 0;
  } else {
    let next = currentTask;

    while (next === currentTask) {
      next = Math.floor(Math.random() * filteredTasks.length);
    }

    currentTask = next;
  }

  renderTask();
}

function renderSubjectCards() {
  const container = document.getElementById("subjectCards");
  if (!container) return;

  container.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    container.innerHTML =
      "<div class='panel subject-card empty-subject-card'><b>База заданий загружается...</b><p class='muted'>Если карточки не появились, проверь tasks.json.</p></div>";
    return;
  }

  const subjects = uniqueValues("subject", tasks);

  subjects.forEach(function (subject) {
    const allCount = tasks.filter(function (task) {
      return task.subject === subject;
    }).length;

    const solvedCount = tasks.filter(function (task) {
      return task.subject === subject && solvedTasks.includes(task.id);
    }).length;

    const percent = allCount ? Math.round((solvedCount / allCount) * 100) : 0;

    const div = document.createElement("div");
    div.className = "panel subject-card";

    div.innerHTML =
      '<div class="subject-glow"></div>' +
      '<div class="icon">' + (SUBJECT_META[subject] || "📚") + "</div>" +
      "<h3>" + subject + "</h3>" +
      "<p>" + solvedCount + " / " + allCount + " решено</p>" +
      '<div class="bar"><span style="width:' + percent + '%"></span></div>';

    div.onclick = function () {
      openPage("tasks");

      const subjectFilter = document.getElementById("subjectFilter");

      if (subjectFilter) {
        subjectFilter.value = subject;
        applyFilters();
      }
    };

    container.appendChild(div);
  });
}

function sendChat() {
  const input = document.getElementById("chatInput");
  const log = document.getElementById("chatLog");

  if (!input || !log) return;

  const text = input.value.trim();
  if (!text) return;

  log.innerHTML += '<div class="message user">' + text + "</div>";

  let answer = "Я пока демо-репетитор. Могу объяснить проценты, вероятность, скорость и план подготовки.";
  const lower = text.toLowerCase();

  if (lower.includes("процент")) {
    answer = "Проценты считаются от 100. Например, 25% от 800 = 800 * 0.25 = 200.";
  }

  if (lower.includes("вероят")) {
    answer = "Вероятность = подходящие исходы / все исходы. Например, 4 из 10 = 0.4.";
  }

  if (lower.includes("скорост")) {
    answer = "Скорость = путь / время. Например, 100 метров за 20 секунд: 100 / 20 = 5.";
  }

  log.innerHTML += '<div class="message bot-msg">' + answer + "</div>";
  input.value = "";
}

setupNavigation();
updateStatsUI();
loadTasks();

 /* ===== live dashboard metrics patch ===== */

const LIVE_EXAM_DATE = new Date("2027-05-27T00:00:00");

function dashboardAccuracy(correct, solved) {
  if (!solved) return 0;
  return Math.round((correct / solved) * 100);
}

function dashboardReadiness() {
  if (!stats || !stats.solved) return 0;

  const acc = dashboardAccuracy(stats.correct, stats.solved);
  const solvedBonus = Math.min(25, Math.round(stats.solved / 4));

  return Math.min(100, Math.round(acc * 0.75 + solvedBonus));
}

function dashboardDaysLeft() {
  const diff = LIVE_EXAM_DATE - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function dashboardForecast() {
  const readiness = dashboardReadiness();

  if (readiness === 0) return "—";
  if (readiness < 35) return "45 → 58";
  if (readiness < 55) return "58 → 70";
  if (readiness < 75) return "70 → 82";
  if (readiness < 90) return "82 → 90";
  return "90+";
}

function dashboardWeakTopics(limit = 3) {
  if (!stats || !stats.byTopic) return [];

  return Object.keys(stats.byTopic)
    .map(function (topic) {
      const item = stats.byTopic[topic];

      return {
        name: topic,
        solved: item.solved,
        correct: item.correct,
        wrong: item.wrong,
        accuracy: dashboardAccuracy(item.correct, item.solved)
      };
    })
    .filter(function (item) {
      return item.solved >= 1 && item.wrong > 0;
    })
    .sort(function (a, b) {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return b.wrong - a.wrong;
    })
    .slice(0, limit);
}

function dashboardSubjectPercent(subject) {
  if (!tasks || !tasks.length) return 0;

  const subjectTasks = tasks.filter(function (task) {
    return task.subject === subject;
  });

  if (!subjectTasks.length) return 0;

  const solved = subjectTasks.filter(function (task) {
    return solvedTasks.includes(task.id);
  }).length;

  const progressBySolved = Math.round((solved / subjectTasks.length) * 100);
  const subjectStats = stats.bySubject[subject];

  if (!subjectStats || !subjectStats.solved) {
    return progressBySolved;
  }

  const acc = dashboardAccuracy(subjectStats.correct, subjectStats.solved);

  return Math.round(progressBySolved * 0.55 + acc * 0.45);
}

function dashboardMainSubjects(limit = 3) {
  if (!tasks || !tasks.length) return [];

  const subjects = uniqueValues("subject", tasks);
  const usedSubjects = Object.keys(stats.bySubject || {});

  return subjects
    .slice()
    .sort(function (a, b) {
      const aUsed = usedSubjects.includes(a) ? 1 : 0;
      const bUsed = usedSubjects.includes(b) ? 1 : 0;

      if (aUsed !== bUsed) return bUsed - aUsed;

      const aSolved = stats.bySubject[a]?.solved || 0;
      const bSolved = stats.bySubject[b]?.solved || 0;

      return bSolved - aSolved;
    })
    .slice(0, limit);
}

function updateDashboardUI() {
  const readiness = dashboardReadiness();
  const daysLeft = dashboardDaysLeft();
  const forecast = dashboardForecast();

  const heroTitle = document.querySelector(".hero-panel h1");
  const ring = document.querySelector(".progress-ring");
  const compactPanels = document.querySelectorAll(".compact-panel");
  const scoreTitle = document.querySelector(".score-panel h1");
  const weakList = document.querySelector(".weak-panel .pill-list");
  const todayList = document.querySelector(".today-panel .clean-list");
  const aiText = document.querySelector(".ai-panel p");
  const subjectPanel = document.querySelector(".subject-panel");

  if (heroTitle) heroTitle.textContent = "Готовность к ЕГЭ: " + readiness + "%";
  if (ring) ring.textContent = readiness + "%";

  if (compactPanels[0]) {
    const h1 = compactPanels[0].querySelector("h1");
    const p = compactPanels[0].querySelector("p:last-child");

    if (h1) h1.textContent = daysLeft;
    if (p) p.textContent = "дней до экзамена";
  }

  if (compactPanels[1]) {
    const h1 = compactPanels[1].querySelector("h1");
    if (h1) h1.textContent = "80+";
  }

  if (scoreTitle) scoreTitle.textContent = forecast;

  const weakTopics = dashboardWeakTopics(3);

  if (weakList) {
    weakList.innerHTML = "";

    if (!weakTopics.length) {
      ["Реши 3–5 заданий", "Ошибки появятся здесь", "Потом дадим план"].forEach(function (text) {
        const span = document.createElement("span");
        span.textContent = text;
        weakList.appendChild(span);
      });
    } else {
      weakTopics.forEach(function (item) {
        const span = document.createElement("span");
        span.textContent = item.name + " · " + item.accuracy + "%";
        weakList.appendChild(span);
      });
    }
  }

  if (todayList) {
    const firstWeak = weakTopics[0]?.name || "Проценты";

    todayList.innerHTML =
      "<li>Решить 10 заданий</li>" +
      "<li>Повторить: " + firstWeak + "</li>" +
      "<li>Проверить статистику</li>";
  }

  if (aiText) {
    if (weakTopics.length) {
      aiText.textContent =
        "Сегодня лучше потренировать: " +
        weakTopics.map(function (item) { return item.name; }).join(", ") +
        ". Эти темы сейчас слабее остальных.";
    } else {
      aiText.textContent =
        "Сегодня лучше начать с базовой тренировки. После ошибок появятся персональные рекомендации.";
    }
  }

  if (subjectPanel && tasks && tasks.length) {
    const oldTitle = subjectPanel.querySelector(".section-title");
    const subjects = dashboardMainSubjects(3);

    subjectPanel.innerHTML = "";

    if (oldTitle) {
      subjectPanel.appendChild(oldTitle);
    } else {
      const newTitle = document.createElement("div");
      newTitle.className = "section-title";
      newTitle.innerHTML =
        '<b>📚 Мои предметы</b><button class="btn small ghost" onclick="openPage(\\'subjects\\')">Выбрать</button>';
      subjectPanel.appendChild(newTitle);
    }

    subjects.forEach(function (subject) {
      const percent = dashboardSubjectPercent(subject);

      const row = document.createElement("div");
      row.className = "subject-progress-row";
      row.innerHTML =
        "<div><b>" + subject + "</b><p>" + percent + "%</p></div>" +
        '<div class="mini-progress"><span style="width:' + percent + '%"></span></div>';

      subjectPanel.appendChild(row);
    });
  }
}

/* Перезаписываем старую функцию слабой темы */
function weakestTopic() {
  const weak = dashboardWeakTopics(1);

  if (!weak.length) return "Пока мало данных";

  return weak[0].name + " — " + weak[0].accuracy + "%";
}

/* Перезаписываем updateStatsUI, чтобы она обновляла и Dashboard */
function updateStatsUI() {
  const solved = document.getElementById("statSolved");
  const correct = document.getElementById("statCorrect");
  const wrong = document.getElementById("statWrong");
  const acc = document.getElementById("statAccuracy");
  const weak = document.getElementById("statWeakTopic");
  const list = document.getElementById("subjectStatsList");

  if (solved) solved.textContent = stats.solved;
  if (correct) correct.textContent = stats.correct;
  if (wrong) wrong.textContent = stats.wrong;
  if (acc) acc.textContent = dashboardAccuracy(stats.correct, stats.solved) + "%";
  if (weak) weak.textContent = weakestTopic();

  if (list) {
    list.innerHTML = "";

    const subjects = Object.keys(stats.bySubject);

    if (subjects.length === 0) {
      list.innerHTML = "<p class='muted'>Реши несколько заданий, и здесь появится статистика по предметам.</p>";
    } else {
      subjects.forEach(function (subject) {
        const item = stats.bySubject[subject];

        const div = document.createElement("div");
        div.className = "subject-stat";
        div.innerHTML =
          "<b>" + subject + "</b>" +
          "<span>Решено: " + item.solved + "</span>" +
          "<span>Верно: " + item.correct + "</span>" +
          "<span>Точность: " + dashboardAccuracy(item.correct, item.solved) + "%</span>";

        list.appendChild(div);
      });
    }
  }

  updateDashboardUI();
}

/* Гарантия, что Dashboard обновится после загрузки tasks.json */
setTimeout(updateDashboardUI, 300);
setTimeout(updateDashboardUI, 900);
setTimeout(updateDashboardUI, 1600);