let tasks = [];
let filteredTasks = [];
let currentTask = 0;
let currentSubject = "all";
let currentTopic = "all";
let currentEge = "all";
let currentDifficulty = "all";

let stats = JSON.parse(localStorage.getItem("egeAiStats") || '{"solved":0,"correct":0,"wrong":0,"bySubject":{},"byTopic":{}}');

function saveStats() {
  localStorage.setItem("egeAiStats", JSON.stringify(stats));
}

function resetStats() {
  stats = { solved: 0, correct: 0, wrong: 0, bySubject: {}, byTopic: {} };
  saveStats();
  updateStatsUI();
}

function accuracy(correct, solved) {
  if (!solved) return 0;
  return Math.round((correct / solved) * 100);
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
    return (currentSubject === "all" || task.subject === currentSubject) &&
           (currentTopic === "all" || task.topic === currentTopic) &&
           (currentEge === "all" || task.egeNumber === currentEge) &&
           (currentDifficulty === "all" || task.difficulty === currentDifficulty);
  });

  currentTask = 0;
  updateTaskCount();
  renderTask();
}

async function loadTasks() {
  try {
    const response = await fetch("tasks.json");
    tasks = await response.json();
    filteredTasks = tasks.slice();

    populateFilters();
    renderSubjectCards();

    currentTask = Math.floor(Math.random() * filteredTasks.length);

    updateTaskCount();
    renderTask();
  } catch (error) {
    console.error("Не удалось загрузить tasks.json", error);
    tasks = [];
    filteredTasks = [];
    renderTask();
  }
}

function updateTaskCount() {
  const el = document.getElementById("taskCount");
  if (el) el.textContent = "Найдено заданий: " + filteredTasks.length;
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
    taskMeta.textContent = "Измени фильтры";
    if (taskDifficulty) taskDifficulty.textContent = "";
    taskQuestion.textContent = "По выбранным параметрам пока нет заданий.";
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
  } else {
    result.style.color = "#ff5a5a";
    result.textContent = "Пока неверно. " + task.explanation;
    registerAnswer(false, task);
  }
}

function nextTask() {
  if (!filteredTasks || filteredTasks.length === 0) return;

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
  if (!container || !tasks.length) return;

  const subjects = uniqueValues("subject", tasks);
  container.innerHTML = "";

  const icons = {
    "Математика профиль": "📐",
    "Математика база": "📘",
    "Русский язык": "🇷🇺",
    "Обществознание": "⚖️",
    "Физика": "⚡",
    "Информатика": "💻",
    "Английский язык": "🇬🇧"
  };

  subjects.forEach(function (subject) {
    const count = tasks.filter(function (task) {
      return task.subject === subject;
    }).length;

    const div = document.createElement("div");
    div.className = "card subject";

    div.innerHTML =
      '<div class="icon">' + (icons[subject] || "📚") + "</div>" +
      "<h3>" + subject + "</h3>" +
      "<p>" + count + " заданий в базе</p>" +
      '<div class="bar"></div>';

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
