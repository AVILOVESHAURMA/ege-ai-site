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

/* ===== safe live dashboard patch ===== */
/* Вставь этот код в самый низ script.js. Он ничего не перезаписывает и не ломает кнопку входа. */

(function () {
  const EXAM_DATE = new Date("2027-05-27T00:00:00");

  function safeAccuracy(correct, solved) {
    if (!solved) return 0;
    return Math.round((correct / solved) * 100);
  }

  function safeReadiness() {
    if (!window.stats && typeof stats === "undefined") return 0;
    if (!stats || !stats.solved) return 0;

    const acc = safeAccuracy(stats.correct, stats.solved);
    const solvedBonus = Math.min(25, Math.round(stats.solved / 4));

    return Math.min(100, Math.round(acc * 0.75 + solvedBonus));
  }

  function safeDaysLeft() {
    const diff = EXAM_DATE - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  function safeForecast() {
    const readiness = safeReadiness();

    if (readiness === 0) return "—";
    if (readiness < 35) return "45 → 58";
    if (readiness < 55) return "58 → 70";
    if (readiness < 75) return "70 → 82";
    if (readiness < 90) return "82 → 90";
    return "90+";
  }

  function safeWeakTopics(limit) {
    if (!stats || !stats.byTopic) return [];

    return Object.keys(stats.byTopic)
      .map(function (topic) {
        const item = stats.byTopic[topic];

        return {
          name: topic,
          solved: item.solved || 0,
          correct: item.correct || 0,
          wrong: item.wrong || 0,
          accuracy: safeAccuracy(item.correct || 0, item.solved || 0)
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

  function safeUniqueSubjects() {
    if (!Array.isArray(tasks)) return [];

    return [...new Set(
      tasks
        .map(function (task) { return task.subject; })
        .filter(Boolean)
    )];
  }

  function safeSubjectPercent(subject) {
    if (!Array.isArray(tasks) || !tasks.length) return 0;

    const subjectTasks = tasks.filter(function (task) {
      return task.subject === subject;
    });

    if (!subjectTasks.length) return 0;

    const solved = subjectTasks.filter(function (task) {
      return solvedTasks.includes(task.id);
    }).length;

    const progressBySolved = Math.round((solved / subjectTasks.length) * 100);
    const subjectStats = stats.bySubject && stats.bySubject[subject];

    if (!subjectStats || !subjectStats.solved) {
      return progressBySolved;
    }

    const acc = safeAccuracy(subjectStats.correct, subjectStats.solved);

    return Math.round(progressBySolved * 0.55 + acc * 0.45);
  }

  function safeMainSubjects(limit) {
    const subjects = safeUniqueSubjects();

    if (!subjects.length) return [];

    const usedSubjects = stats && stats.bySubject ? Object.keys(stats.bySubject) : [];

    return subjects
      .slice()
      .sort(function (a, b) {
        const aUsed = usedSubjects.includes(a) ? 1 : 0;
        const bUsed = usedSubjects.includes(b) ? 1 : 0;

        if (aUsed !== bUsed) return bUsed - aUsed;

        const aSolved = stats.bySubject && stats.bySubject[a] ? stats.bySubject[a].solved : 0;
        const bSolved = stats.bySubject && stats.bySubject[b] ? stats.bySubject[b].solved : 0;

        return bSolved - aSolved;
      })
      .slice(0, limit);
  }

  function updateLiveDashboard() {
    try {
      const readiness = safeReadiness();
      const daysLeft = safeDaysLeft();
      const forecast = safeForecast();

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

      const weakTopics = safeWeakTopics(3);

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
        const firstWeak = weakTopics.length ? weakTopics[0].name : "Проценты";

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

      if (subjectPanel && Array.isArray(tasks) && tasks.length) {
        const title = subjectPanel.querySelector(".section-title");
        const subjects = safeMainSubjects(3);

        const oldRows = subjectPanel.querySelectorAll(".subject-progress-row");
        oldRows.forEach(function (row) {
          row.remove();
        });

        subjects.forEach(function (subject) {
          const percent = safeSubjectPercent(subject);

          const row = document.createElement("div");
          row.className = "subject-progress-row";
          row.innerHTML =
            "<div><b>" + subject + "</b><p>" + percent + "%</p></div>" +
            '<div class="mini-progress"><span style="width:' + percent + '%"></span></div>';

          subjectPanel.appendChild(row);
        });
      }
    } catch (error) {
      console.warn("Dashboard patch skipped:", error);
    }
  }

  window.updateLiveDashboard = updateLiveDashboard;

  setTimeout(updateLiveDashboard, 300);
  setTimeout(updateLiveDashboard, 1000);
  setTimeout(updateLiveDashboard, 2000);

  setInterval(updateLiveDashboard, 2500);
})();

/* ===== mistakes / work on errors patch ===== */
/* Вставь в самый низ script.js. Добавляет раздел "Ошибки" без замены старого кода. */

(function () {
  let wrongTaskIds = JSON.parse(localStorage.getItem("wrongTaskIds") || "[]");

  function saveWrongTasks() {
    localStorage.setItem("wrongTaskIds", JSON.stringify(wrongTaskIds));
  }

  function addWrongTask(task) {
    if (!task || !task.id) return;

    if (!wrongTaskIds.includes(task.id)) {
      wrongTaskIds.push(task.id);
      saveWrongTasks();
    }
  }

  function removeWrongTask(taskId) {
    wrongTaskIds = wrongTaskIds.filter(function (id) {
      return id !== taskId;
    });

    saveWrongTasks();
    renderMistakesPage();
  }

  function getWrongTasks() {
    if (!Array.isArray(tasks)) return [];

    return wrongTaskIds
      .map(function (id) {
        return tasks.find(function (task) {
          return task.id === id;
        });
      })
      .filter(Boolean);
  }

  function ensureMistakesNav() {
    const navGroup = document.querySelector(".nav-group") || document.querySelector(".sidebar");

    if (!navGroup) return;

    if (document.querySelector('[data-page="mistakes"]')) return;

    const btn = document.createElement("button");
    btn.className = "nav";
    btn.dataset.page = "mistakes";
    btn.textContent = "✕ Ошибки";

    const tutorBtn = document.querySelector('[data-page="tutor"]');

    if (tutorBtn && tutorBtn.parentNode) {
      tutorBtn.parentNode.insertBefore(btn, tutorBtn);
    } else {
      navGroup.appendChild(btn);
    }

    btn.addEventListener("click", function () {
      openPage("mistakes");
    });
  }

  function ensureMistakesPage() {
    const main = document.querySelector(".main");

    if (!main) return;

    if (document.getElementById("mistakes")) return;

    const section = document.createElement("section");
    section.id = "mistakes";
    section.className = "page";

    section.innerHTML = `
      <div class="page-head">
        <div>
          <h3>Работа над ошибками</h3>
          <p class="muted">Здесь сохраняются задания, где был неправильный ответ.</p>
        </div>

        <button class="btn small" onclick="openPage('tasks')">К заданиям</button>
      </div>

      <div class="mistakes-layout">
        <div class="panel mistakes-main">
          <div class="section-title">
            <div>
              <p class="badge">Ошибки</p>
              <h3>Повтори слабые места</h3>
            </div>
            <p id="mistakesCount" class="muted">0 ошибок</p>
          </div>

          <div id="mistakesList" class="mistakes-list"></div>
        </div>

        <div class="panel mistakes-side">
          <b>Как работать</b>
          <ul class="clean-list">
            <li>Сначала посмотри тему ошибки</li>
            <li>Нажми “Тренировать тему”</li>
            <li>Реши похожие задания</li>
            <li>Верные ответы убирают задачу из ошибок</li>
          </ul>
        </div>
      </div>
    `;

    main.appendChild(section);
  }

  function renderMistakesPage() {
    const list = document.getElementById("mistakesList");
    const count = document.getElementById("mistakesCount");

    if (!list) return;

    const wrongTasks = getWrongTasks();

    if (count) {
      count.textContent = wrongTasks.length + " ошибок";
    }

    list.innerHTML = "";

    if (!wrongTasks.length) {
      list.innerHTML = `
        <div class="empty-state">
          <h3>Ошибок пока нет</h3>
          <p class="muted">Реши несколько заданий. Если ответ будет неверным, задание появится здесь.</p>
          <button class="btn small" onclick="openPage('tasks')">Начать тренировку</button>
        </div>
      `;
      return;
    }

    wrongTasks.forEach(function (task) {
      const card = document.createElement("div");
      card.className = "mistake-card";

      card.innerHTML = `
        <div>
          <div class="task-badges">
            <span>${task.subject || ""}</span>
            <span>${task.topic || ""}</span>
            <span>${task.egeNumber || ""}</span>
          </div>

          <h3>${task.title || "Задание"}</h3>
          <p>${task.question || ""}</p>
          <p class="muted"><b>Разбор:</b> ${task.explanation || "Разбор появится позже."}</p>
        </div>

        <div class="mistake-actions">
          <button class="btn small" data-train="${task.id}">Тренировать тему</button>
          <button class="btn small ghost" data-remove="${task.id}">Убрать</button>
        </div>
      `;

      list.appendChild(card);
    });

    list.querySelectorAll("[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        removeWrongTask(btn.dataset.remove);
      });
    });

    list.querySelectorAll("[data-train]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const task = tasks.find(function (item) {
          return item.id === btn.dataset.train;
        });

        if (!task) return;

        openPage("tasks");

        const subjectFilter = document.getElementById("subjectFilter");
        const topicFilter = document.getElementById("topicFilter");
        const egeFilter = document.getElementById("egeFilter");
        const difficultyFilter = document.getElementById("difficultyFilter");

        if (subjectFilter) {
          subjectFilter.value = task.subject;
          applyFilters();
        }

        setTimeout(function () {
          if (topicFilter) topicFilter.value = task.topic;
          if (egeFilter) egeFilter.value = "all";
          if (difficultyFilter) difficultyFilter.value = "all";
          applyFilters();
        }, 50);
      });
    });
  }

  function initMistakesFeature() {
    ensureMistakesNav();
    ensureMistakesPage();
    renderMistakesPage();
  }

  const oldOpenPage = window.openPage;
  if (typeof oldOpenPage === "function") {
    window.openPage = function (pageId) {
      oldOpenPage(pageId);

      if (pageId === "mistakes") {
        const title = document.getElementById("pageTitle");
        if (title) title.textContent = "Ошибки";
        renderMistakesPage();
      }
    };
  }

  const oldCheckAnswer = window.checkAnswer;
  if (typeof oldCheckAnswer === "function") {
    window.checkAnswer = function () {
      const task = filteredTasks && filteredTasks.length ? filteredTasks[currentTask] : null;
      const answerInput = document.getElementById("answer");

      let isWrong = false;

      if (task && answerInput) {
        const value = answerInput.value.trim().toLowerCase().replace(",", ".");
        const correct = String(task.answer).trim().toLowerCase().replace(",", ".");

        isWrong = value !== correct;
      }

      oldCheckAnswer();

      if (task) {
        if (isWrong) {
          addWrongTask(task);
        } else {
          removeWrongTask(task.id);
        }
      }

      renderMistakesPage();
    };
  }

  const oldResetStats = window.resetStats;
  if (typeof oldResetStats === "function") {
    window.resetStats = function () {
      wrongTaskIds = [];
      saveWrongTasks();
      oldResetStats();
      renderMistakesPage();
    };
  }

  setTimeout(initMistakesFeature, 300);
  setTimeout(initMistakesFeature, 1000);
})();

/* ===== selected subjects / personal cabinet patch ===== */
/* Вставь в самый низ script.js. Добавляет выбор сдаваемых предметов и персональные предметы на главной. */

(function () {
  let selectedSubjects = JSON.parse(localStorage.getItem("selectedSubjects") || "[]");

  function saveSelectedSubjects() {
    localStorage.setItem("selectedSubjects", JSON.stringify(selectedSubjects));
  }

  function getAllSubjects() {
    if (!Array.isArray(tasks)) return [];

    return [...new Set(
      tasks
        .map(function (task) {
          return task.subject;
        })
        .filter(Boolean)
    )];
  }

  function ensureDefaultSubjects() {
    const subjects = getAllSubjects();

    if (!subjects.length) return;

    if (!selectedSubjects.length) {
      selectedSubjects = subjects.slice(0, 3);
      saveSelectedSubjects();
    }
  }

  function subjectStats(subject) {
    const subjectTasks = tasks.filter(function (task) {
      return task.subject === subject;
    });

    const solved = subjectTasks.filter(function (task) {
      return solvedTasks.includes(task.id);
    }).length;

    const total = subjectTasks.length;
    const percent = total ? Math.round((solved / total) * 100) : 0;

    const stat = stats.bySubject && stats.bySubject[subject]
      ? stats.bySubject[subject]
      : { solved: 0, correct: 0, wrong: 0 };

    const acc = stat.solved ? Math.round((stat.correct / stat.solved) * 100) : 0;

    return {
      solved: solved,
      total: total,
      percent: percent,
      accuracy: acc
    };
  }

  function forecastForSubject(subject) {
    const data = subjectStats(subject);

    if (data.solved < 10) {
      return {
        text: "Недостаточно данных",
        need: "Нужно ещё: " + (10 - data.solved) + " задач"
      };
    }

    if (data.solved < 25) {
      return {
        text: "Первичный прогноз",
        need: "Реши ещё " + (25 - data.solved) + " задач для точности"
      };
    }

    let score = Math.round(data.accuracy * 0.75 + data.percent * 0.25);

    if (score < 40) score = 40;
    if (score > 95) score = 95;

    return {
      text: score + "–" + Math.min(100, score + 8) + " баллов",
      need: "Прогноз по текущей статистике"
    };
  }

  function renderSubjectCardsWithSelection() {
    const container = document.getElementById("subjectCards");

    if (!container || !Array.isArray(tasks) || !tasks.length) return;

    ensureDefaultSubjects();

    container.innerHTML = "";

    const subjects = getAllSubjects();

    subjects.forEach(function (subject) {
      const data = subjectStats(subject);
      const forecast = forecastForSubject(subject);
      const isSelected = selectedSubjects.includes(subject);

      const card = document.createElement("div");
      card.className = "panel subject-card selectable-subject-card" + (isSelected ? " selected-subject" : "");

      card.innerHTML =
        '<div class="subject-glow"></div>' +
        '<button class="subject-check" data-subject="' + subject + '">' + (isSelected ? "✓" : "+") + "</button>" +
        '<div class="icon">' + (SUBJECT_META[subject] || "📚") + "</div>" +
        "<h3>" + subject + "</h3>" +
        "<p>" + data.solved + " / " + data.total + " решено</p>" +
        '<div class="bar"><span style="width:' + data.percent + '%"></span></div>' +
        '<div class="subject-forecast">' +
          '<b>' + forecast.text + '</b>' +
          '<span>' + forecast.need + '</span>' +
        '</div>';

      card.addEventListener("click", function (event) {
        if (event.target.classList.contains("subject-check")) {
          toggleSubject(subject);
          return;
        }

        openPage("tasks");

        const subjectFilter = document.getElementById("subjectFilter");

        if (subjectFilter) {
          subjectFilter.value = subject;
          applyFilters();
        }
      });

      container.appendChild(card);
    });
  }

  function toggleSubject(subject) {
    if (selectedSubjects.includes(subject)) {
      selectedSubjects = selectedSubjects.filter(function (item) {
        return item !== subject;
      });
    } else {
      selectedSubjects.push(subject);
    }

    saveSelectedSubjects();
    renderSubjectCardsWithSelection();
    renderSelectedSubjectsOnDashboard();
    updatePlanForSelectedSubjects();
  }

  function renderSelectedSubjectsOnDashboard() {
    const subjectPanel = document.querySelector(".subject-panel");

    if (!subjectPanel || !Array.isArray(tasks) || !tasks.length) return;

    ensureDefaultSubjects();

    const oldTitle = subjectPanel.querySelector(".section-title");

    subjectPanel.innerHTML = "";

    if (oldTitle) {
      subjectPanel.appendChild(oldTitle);
    } else {
      const title = document.createElement("div");
      title.className = "section-title";
      title.innerHTML =
        '<b>📚 Мои предметы</b><button class="btn small ghost" onclick="openPage(\'subjects\')">Выбрать</button>';
      subjectPanel.appendChild(title);
    }

    selectedSubjects.forEach(function (subject) {
      const data = subjectStats(subject);
      const forecast = forecastForSubject(subject);

      const row = document.createElement("div");
      row.className = "subject-progress-row selected-dashboard-row";
      row.innerHTML =
        "<div><b>" + subject + "</b><p>" + data.percent + "% · " + forecast.text + "</p></div>" +
        '<div class="mini-progress"><span style="width:' + data.percent + '%"></span></div>';

      subjectPanel.appendChild(row);
    });

    if (!selectedSubjects.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Выбери предметы, которые будешь сдавать.";
      subjectPanel.appendChild(empty);
    }
  }

  function updatePlanForSelectedSubjects() {
    const todayList = document.querySelector(".today-panel .clean-list");

    if (!todayList) return;

    ensureDefaultSubjects();

    if (!selectedSubjects.length) {
      todayList.innerHTML =
        "<li>Выбери сдаваемые предметы</li>" +
        "<li>Реши стартовые задания</li>" +
        "<li>Проверь статистику</li>";
      return;
    }

    const first = selectedSubjects[0];
    const second = selectedSubjects[1] || selectedSubjects[0];

    todayList.innerHTML =
      "<li>5 задач: " + first + "</li>" +
      "<li>5 задач: " + second + "</li>" +
      "<li>1 разбор ошибок</li>";
  }

  const oldRenderSubjectCards = window.renderSubjectCards;
  if (typeof oldRenderSubjectCards === "function") {
    window.renderSubjectCards = function () {
      renderSubjectCardsWithSelection();
    };
  }

  const oldOpenPage = window.openPage;
  if (typeof oldOpenPage === "function") {
    window.openPage = function (pageId) {
      oldOpenPage(pageId);

      if (pageId === "subjects") {
        renderSubjectCardsWithSelection();
      }

      renderSelectedSubjectsOnDashboard();
      updatePlanForSelectedSubjects();
    };
  }

  window.renderSubjectCardsWithSelection = renderSubjectCardsWithSelection;
  window.renderSelectedSubjectsOnDashboard = renderSelectedSubjectsOnDashboard;

  setTimeout(function () {
    ensureDefaultSubjects();
    renderSubjectCardsWithSelection();
    renderSelectedSubjectsOnDashboard();
    updatePlanForSelectedSubjects();
  }, 400);

  setTimeout(function () {
    ensureDefaultSubjects();
    renderSubjectCardsWithSelection();
    renderSelectedSubjectsOnDashboard();
    updatePlanForSelectedSubjects();
  }, 1200);
})();

/* ===== selected subjects FIX v2 ===== */
/* Вставь в самый низ script.js ПОСЛЕ старого selected-subjects-patch.js.
   Исправляет:
   1) выбранные предметы сохраняются нормально;
   2) на главной показываются ВСЕ выбранные предметы, а не только 3;
   3) дефолтные 3 предмета больше не возвращаются после выбора.
*/

(function () {
  const STORAGE_KEY = "selectedSubjects";

  function getSavedSubjects() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (e) {
      return [];
    }
  }

  function saveSubjects(subjects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }

  function getAllSubjectsSafe() {
    if (!Array.isArray(tasks)) return [];

    return [...new Set(
      tasks
        .map(function (task) {
          return task.subject;
        })
        .filter(Boolean)
    )];
  }

  function getSelectedSubjectsSafe() {
    return getSavedSubjects();
  }

  function subjectStatsSafe(subject) {
    if (!Array.isArray(tasks)) {
      return { solved: 0, total: 0, percent: 0, accuracy: 0 };
    }

    const subjectTasks = tasks.filter(function (task) {
      return task.subject === subject;
    });

    const solved = subjectTasks.filter(function (task) {
      return solvedTasks.includes(task.id);
    }).length;

    const total = subjectTasks.length;
    const percent = total ? Math.round((solved / total) * 100) : 0;

    const stat = stats.bySubject && stats.bySubject[subject]
      ? stats.bySubject[subject]
      : { solved: 0, correct: 0, wrong: 0 };

    const accuracy = stat.solved ? Math.round((stat.correct / stat.solved) * 100) : 0;

    return {
      solved: solved,
      total: total,
      percent: percent,
      accuracy: accuracy
    };
  }

  function forecastForSubjectSafe(subject) {
    const data = subjectStatsSafe(subject);

    if (data.solved < 10) {
      return {
        text: "Недостаточно данных",
        need: "Нужно ещё: " + (10 - data.solved) + " задач"
      };
    }

    if (data.solved < 25) {
      return {
        text: "Первичный прогноз",
        need: "Реши ещё " + (25 - data.solved) + " задач для точности"
      };
    }

    let score = Math.round(data.accuracy * 0.75 + data.percent * 0.25);

    if (score < 40) score = 40;
    if (score > 95) score = 95;

    return {
      text: score + "–" + Math.min(100, score + 8) + " баллов",
      need: "Прогноз по текущей статистике"
    };
  }

  function toggleSubjectFixed(subject) {
    let selected = getSelectedSubjectsSafe();

    if (selected.includes(subject)) {
      selected = selected.filter(function (item) {
        return item !== subject;
      });
    } else {
      selected.push(subject);
    }

    saveSubjects(selected);

    renderSubjectCardsFixed();
    renderDashboardSubjectsFixed();
    updateTodayPlanFixed();
  }

  function renderSubjectCardsFixed() {
    const container = document.getElementById("subjectCards");
    if (!container || !Array.isArray(tasks) || !tasks.length) return;

    const selected = getSelectedSubjectsSafe();
    const subjects = getAllSubjectsSafe();

    container.innerHTML = "";

    subjects.forEach(function (subject) {
      const data = subjectStatsSafe(subject);
      const forecast = forecastForSubjectSafe(subject);
      const isSelected = selected.includes(subject);

      const card = document.createElement("div");
      card.className = "panel subject-card selectable-subject-card" + (isSelected ? " selected-subject" : "");

      card.innerHTML =
        '<div class="subject-glow"></div>' +
        '<button class="subject-check" type="button">' + (isSelected ? "✓" : "+") + "</button>" +
        '<div class="icon">' + (SUBJECT_META[subject] || "📚") + "</div>" +
        "<h3>" + subject + "</h3>" +
        "<p>" + data.solved + " / " + data.total + " решено</p>" +
        '<div class="bar"><span style="width:' + data.percent + '%"></span></div>' +
        '<div class="subject-forecast">' +
          '<b>' + forecast.text + '</b>' +
          '<span>' + forecast.need + '</span>' +
        '</div>';

      const check = card.querySelector(".subject-check");

      check.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleSubjectFixed(subject);
      });

      card.addEventListener("click", function () {
        openPage("tasks");

        setTimeout(function () {
          const subjectFilter = document.getElementById("subjectFilter");

          if (subjectFilter) {
            subjectFilter.value = subject;
            applyFilters();
          }
        }, 50);
      });

      container.appendChild(card);
    });
  }

  function renderDashboardSubjectsFixed() {
    const subjectPanel = document.querySelector(".subject-panel");
    if (!subjectPanel || !Array.isArray(tasks) || !tasks.length) return;

    const selected = getSelectedSubjectsSafe();

    subjectPanel.innerHTML =
      '<div class="section-title">' +
        '<b>📚 Мои предметы</b>' +
        '<button class="btn small ghost" onclick="openPage(\'subjects\')">Выбрать</button>' +
      '</div>';

    if (!selected.length) {
      const empty = document.createElement("div");
      empty.className = "selected-empty-state";
      empty.innerHTML =
        "<b>Предметы не выбраны</b>" +
        "<p class='muted'>Открой раздел “Предметы” и нажми + на тех предметах, которые будешь сдавать.</p>";

      subjectPanel.appendChild(empty);
      return;
    }

    selected.forEach(function (subject) {
      const data = subjectStatsSafe(subject);
      const forecast = forecastForSubjectSafe(subject);

      const row = document.createElement("div");
      row.className = "subject-progress-row selected-dashboard-row";
      row.innerHTML =
        "<div><b>" + subject + "</b><p>" + data.percent + "% · " + forecast.text + "</p></div>" +
        '<div class="mini-progress"><span style="width:' + data.percent + '%"></span></div>';

      subjectPanel.appendChild(row);
    });
  }

  function updateTodayPlanFixed() {
    const todayList = document.querySelector(".today-panel .clean-list");
    if (!todayList) return;

    const selected = getSelectedSubjectsSafe();

    if (!selected.length) {
      todayList.innerHTML =
        "<li>Выбери сдаваемые предметы</li>" +
        "<li>Реши стартовые задания</li>" +
        "<li>Проверь статистику</li>";
      return;
    }

    const items = selected.slice(0, 4).map(function (subject) {
      return "<li>5 задач: " + subject + "</li>";
    });

    items.push("<li>1 разбор ошибок</li>");

    todayList.innerHTML = items.join("");
  }

  function updateAiRecommendationFixed() {
    const aiText = document.querySelector(".ai-panel p");
    if (!aiText) return;

    const selected = getSelectedSubjectsSafe();

    if (!selected.length) {
      aiText.textContent = "Выбери предметы, которые будешь сдавать, и EGE AI соберёт план подготовки под них.";
      return;
    }

    aiText.textContent =
      "Сегодня лучше двигаться по выбранным предметам: " +
      selected.slice(0, 4).join(", ") +
      ". После ошибок рекомендации станут точнее.";
  }

  function refreshSelectedSubjectsFixed() {
    renderSubjectCardsFixed();
    renderDashboardSubjectsFixed();
    updateTodayPlanFixed();
    updateAiRecommendationFixed();
  }

  const oldOpenPage = window.openPage;
  if (typeof oldOpenPage === "function") {
    window.openPage = function (pageId) {
      oldOpenPage(pageId);

      setTimeout(function () {
        if (pageId === "subjects") renderSubjectCardsFixed();
        renderDashboardSubjectsFixed();
        updateTodayPlanFixed();
        updateAiRecommendationFixed();
      }, 50);
    };
  }

  const oldRenderSubjectCards = window.renderSubjectCards;
  window.renderSubjectCards = function () {
    renderSubjectCardsFixed();
  };

  window.renderSubjectCardsFixed = renderSubjectCardsFixed;
  window.renderDashboardSubjectsFixed = renderDashboardSubjectsFixed;
  window.refreshSelectedSubjectsFixed = refreshSelectedSubjectsFixed;

  setTimeout(refreshSelectedSubjectsFixed, 300);
  setTimeout(refreshSelectedSubjectsFixed, 1000);
  setTimeout(refreshSelectedSubjectsFixed, 2000);
})();