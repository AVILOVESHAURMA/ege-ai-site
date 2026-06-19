let tasks = [];
let currentTask = 0;

let filteredTasks = [];
let currentSubject = "all";
let currentTopic = "all";

async function loadTasks() {
  
    try {
        const response = await fetch("tasks.json");

        tasks = await response.json();

        filteredTasks = [...tasks];

        populateFilters();

        currentTask = Math.floor(Math.random() * tasks.length);

        renderTask();

    } catch (error) {
        console.error(error);
    }
}

function openApp() {

  const landing = document.getElementById("landing");

  const app = document.getElementById("app");

  if (landing) {

    landing.style.display = "none";

  }

  if (app) {

    app.classList.remove("hidden");

  }

  window.scrollTo(0, 0);

}

function setupNavigation() {

  document.querySelectorAll(".nav").forEach(function (btn) {

    btn.addEventListener("click", function () {

      const pageId = btn.dataset.page;

      const page = document.getElementById(pageId);

      if (!page) {

        return;

      }

      document.querySelectorAll(".nav").forEach(function (item) {

        item.classList.remove("active");

      });

      document.querySelectorAll(".page").forEach(function (item) {

        item.classList.remove("active");

      });

      btn.classList.add("active");

      page.classList.add("active");

      window.scrollTo(0, 0);

    });

  });

}

function loadTasks() {

  fetch("tasks.json")

    .then(function (response) {

      return response.json();

    })

    .then(function (data) {

      tasks = data;

      currentTask = Math.floor(Math.random() * tasks.length);

      renderTask();

    })

    .catch(function () {

      tasks = [

        {

          subject: "Математика профиль",

          topic: "Проценты",

          title: "Проценты. Базовая задача",

          question: "Цена товара была 800 рублей. Ее увеличили на 25%. Какой стала цена?",

          answer: "1000",

          explanation: "25% от 800 = 200. Новая цена: 1000 рублей."

        }

      ];

      renderTask();

    });

}

function renderTask() {

  if (!tasks || tasks.length === 0) {

    return;

  }

  const task = filteredTasks[currentTask];

  const taskTitle = document.getElementById("taskTitle");

  const taskMeta = document.getElementById("taskMeta");

  const taskQuestion = document.getElementById("taskQuestion");

  const answerInput = document.getElementById("answer");

  const result = document.getElementById("result");

  if (!taskTitle || !taskMeta || !taskQuestion || !answerInput || !result) {

    return;

  }

  taskTitle.textContent = task.title;

  taskMeta.textContent = task.subject + " - " + task.topic;

  taskQuestion.textContent = task.question;

  answerInput.value = "";

  result.textContent = "";

}

function checkAnswer() {

  if (!tasks || tasks.length === 0) {

    return;

  }

  const task = filteredTasks[currentTask];

  const answerInput = document.getElementById("answer");

  const result = document.getElementById("result");

  if (!answerInput || !result) {

    return;

  }

  const value = answerInput.value.trim().toLowerCase().replace(",", ".");

  const correctAnswer = String(task.answer).trim().toLowerCase().replace(",", ".");

  if (value === correctAnswer) {

    result.style.color = "#22c55e";

    result.textContent = "Верно! " + task.explanation;

  } else {

    result.style.color = "#f87171";

    result.textContent = "Пока неверно. " + task.explanation;

  }

}

function nextTask() {

  if (!filteredTasks || filteredTasks.length === 0) {

    return;

  }

  currentTask = Math.floor(Math.random() * filteredTasks.length);

  renderTask();

}

function sendChat() {

  const input = document.getElementById("chatInput");

  const log = document.getElementById("chatLog");

  if (!input || !log) {

    return;

  }

  const text = input.value.trim();

  if (!text) {

    return;

  }

  log.innerHTML += '<div class="message user">' + text + '</div>';

  let botAnswer = "Я пока демо-репетитор. Могу объяснить проценты, вероятность, скорость и план подготовки.";

  const lowerText = text.toLowerCase();

  if (lowerText.includes("процент")) {

    botAnswer = "Проценты считаются от 100. Например, 25% от 800 = 800 * 0.25 = 200.";

  }

  if (lowerText.includes("вероят")) {

    botAnswer = "Вероятность = подходящие исходы / все исходы. Например, 4 синих шара из 10: 4 / 10 = 0.4.";

  }

  if (lowerText.includes("скорост")) {

    botAnswer = "Скорость = путь / время. Например, 100 метров за 20 секунд: 100 / 20 = 5 м/с.";

  }

  log.innerHTML += '<div class="message bot-msg">' + botAnswer + '</div>';
  input.value = "";

}

setupNavigation();

loadTasks();

function populateFilters() {

    const subjectFilter = document.getElementById("subjectFilter");
    const topicFilter = document.getElementById("topicFilter");

    if (!subjectFilter || !topicFilter) return;

    const subjects = [...new Set(tasks.map(task => task.subject))];

    subjects.forEach(subject => {

        const option = document.createElement("option");

        option.value = subject;

        option.textContent = subject;

        subjectFilter.appendChild(option);

    });

}

function applyFilters() {

    const subjectFilter = document.getElementById("subjectFilter");
    const topicFilter = document.getElementById("topicFilter");

    currentSubject = subjectFilter.value;
    currentTopic = topicFilter.value;

    filteredTasks = tasks.filter(task => {

        const subjectMatch =
            currentSubject === "all" ||
            task.subject === currentSubject;

        const topicMatch =
            currentTopic === "all" ||
            task.topic === currentTopic;

        return subjectMatch && topicMatch;

    });

    currentTask = 0;

    renderTask();

}