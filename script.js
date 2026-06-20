let tasks = [];
let filteredTasks = [];
let currentTask = 0;
let currentSubject = "all";
let currentTopic = "all";

function openApp() {
  const landing = document.getElementById("landing");
  const app = document.getElementById("app");
  if (landing) landing.classList.add("hidden");
  if (app) app.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function setupNavigation() {
  document.querySelectorAll(".nav").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const pageId = btn.dataset.page;
      const page = document.getElementById(pageId);
      if (!page) return;
      document.querySelectorAll(".nav").forEach(function (item) { item.classList.remove("active"); });
      document.querySelectorAll(".page").forEach(function (item) { item.classList.remove("active"); });
      btn.classList.add("active");
      page.classList.add("active");
      const heading = document.getElementById("pageHeading");
      if (heading) heading.textContent = btn.textContent;
      window.scrollTo(0, 0);
    });
  });

  document.querySelectorAll(".subject-card").forEach(function (card) {
    card.addEventListener("click", function () {
      openAppPage("tasks");
      const subject = card.dataset.subject;
      const subjectFilter = document.getElementById("subjectFilter");
      if (subjectFilter && subject) {
        subjectFilter.value = subject;
        applyFilters();
      }
    });
  });
}

function openAppPage(pageId) {
  const page = document.getElementById(pageId);
  if (!page) return;
  document.querySelectorAll(".nav").forEach(function (item) { item.classList.toggle("active", item.dataset.page === pageId); });
  document.querySelectorAll(".page").forEach(function (item) { item.classList.remove("active"); });
  page.classList.add("active");
  const activeNav = document.querySelector('.nav[data-page="' + pageId + '"]');
  const heading = document.getElementById("pageHeading");
  if (activeNav && heading) heading.textContent = activeNav.textContent;
}

async function loadTasks() {
  try {
    const response = await fetch("tasks.json");
    tasks = await response.json();
  } catch (error) {
    tasks = fallbackTasks();
  }
  filteredTasks = tasks.slice();
  populateFilters();
  nextTask();
}

function populateFilters() {
  const subjectFilter = document.getElementById("subjectFilter");
  const topicFilter = document.getElementById("topicFilter");
  if (!subjectFilter || !topicFilter) return;
  subjectFilter.innerHTML = '<option value="all">Все предметы</option>';
  topicFilter.innerHTML = '<option value="all">Все темы</option>';
  const subjects = Array.from(new Set(tasks.map(function (task) { return task.subject; }))).filter(Boolean);
  subjects.forEach(function (subject) {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectFilter.appendChild(option);
  });
  refreshTopics();
}

function refreshTopics() {
  const topicFilter = document.getElementById("topicFilter");
  if (!topicFilter) return;
  topicFilter.innerHTML = '<option value="all">Все темы</option>';
  const source = currentSubject === "all" ? tasks : tasks.filter(function (task) { return task.subject === currentSubject; });
  const topics = Array.from(new Set(source.map(function (task) { return task.topic; }))).filter(Boolean);
  topics.forEach(function (topic) {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    topicFilter.appendChild(option);
  });
}

function applyFilters() {
  const subjectFilter = document.getElementById("subjectFilter");
  const topicFilter = document.getElementById("topicFilter");
  if (!subjectFilter || !topicFilter) return;
  const oldSubject = currentSubject;
  currentSubject = subjectFilter.value;
  if (oldSubject !== currentSubject) {
    currentTopic = "all";
    refreshTopics();
    topicFilter.value = "all";
  } else {
    currentTopic = topicFilter.value;
  }
  filteredTasks = tasks.filter(function (task) {
    const subjectMatch = currentSubject === "all" || task.subject === currentSubject;
    const topicMatch = currentTopic === "all" || task.topic === currentTopic;
    return subjectMatch && topicMatch;
  });
  currentTask = 0;
  renderTask();
}

function renderTask() {
  const taskTitle = document.getElementById("taskTitle");
  const taskMeta = document.getElementById("taskMeta");
  const taskQuestion = document.getElementById("taskQuestion");
  const answerInput = document.getElementById("answer");
  const result = document.getElementById("result");
  if (!taskTitle || !taskMeta || !taskQuestion || !answerInput || !result) return;
  if (!filteredTasks.length) {
    taskTitle.textContent = "Заданий нет";
    taskMeta.textContent = "Выберите другой фильтр";
    taskQuestion.textContent = "В этой теме пока нет заданий.";
    answerInput.value = "";
    result.textContent = "";
    return;
  }
  const task = filteredTasks[currentTask];
  taskTitle.textContent = task.title;
  taskMeta.textContent = task.subject + " · " + task.topic;
  taskQuestion.textContent = task.question;
  answerInput.value = "";
  result.textContent = "";
}

function checkAnswer() {
  if (!filteredTasks.length) return;
  const task = filteredTasks[currentTask];
  const answerInput = document.getElementById("answer");
  const result = document.getElementById("result");
  if (!answerInput || !result) return;
  const value = normalizeAnswer(answerInput.value);
  const correctAnswer = normalizeAnswer(task.answer);
  if (value === correctAnswer) {
    result.style.color = "#22c55e";
    result.textContent = "✅ Верно! " + task.explanation;
  } else {
    result.style.color = "#ef4444";
    result.textContent = "❌ Пока неверно. " + task.explanation;
  }
}
function normalizeAnswer(value) { return String(value).trim().toLowerCase().replace(",", "."); }
function nextTask() { if (!filteredTasks.length) { renderTask(); return; } currentTask = Math.floor(Math.random() * filteredTasks.length); renderTask(); }
function sendChat() {
  const input = document.getElementById("chatInput");
  const log = document.getElementById("chatLog");
  if (!input || !log) return;
  const text = input.value.trim();
  if (!text) return;
  log.innerHTML += '<div class="message user">' + escapeHtml(text) + "</div>";
  let botAnswer = "Я пока демо-репетитор. Могу объяснить проценты, вероятность, скорость и план подготовки.";
  const lowerText = text.toLowerCase();
  if (lowerText.includes("процент")) botAnswer = "Проценты считаются от 100. Например, 25% от 800 = 800 × 0.25 = 200.";
  if (lowerText.includes("вероят")) botAnswer = "Вероятность = подходящие исходы / все исходы. Например, 4 синих шара из 10: 4 / 10 = 0.4.";
  if (lowerText.includes("скорост")) botAnswer = "Скорость = путь / время. Например, 100 метров за 20 секунд: 100 / 20 = 5 м/с.";
  log.innerHTML += '<div class="message bot-msg">' + botAnswer + "</div>";
  input.value = "";
}
function escapeHtml(value) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function fallbackTasks() { return [{subject:"Математика профиль",topic:"Проценты",title:"Проценты 1",question:"Цена товара была 800 рублей. Ее увеличили на 25%. Какой стала цена?",answer:"1000",explanation:"25% от 800 = 200. Новая цена 1000."}]; }
setupNavigation();
loadTasks();
