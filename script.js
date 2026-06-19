const tasks = [
  {
    subject: "Математика профиль",
    topic: "Проценты",
    title: "Проценты. Базовая задача",
    question: "Цена товара была 800 ₽. Её увеличили на 25%. Какой стала цена?",
    answer: "1000",
    explanation: "25% от 800 — это 800 × 0.25 = 200. Новая цена: 800 + 200 = 1000 ₽."
  },
  {
    subject: "Математика профиль",
    topic: "Вероятность",
    title: "Вероятность. Шары",
    question: "В коробке 6 красных и 4 синих шара. Какова вероятность достать синий шар?",
    answer: "0.4",
    explanation: "Всего шаров 10. Синих 4. Вероятность = 4/10 = 0.4."
  },
  {
    subject: "Математика база",
    topic: "Проценты",
    title: "Скидка",
    question: "Товар стоил 1200 ₽. После скидки 15% сколько он стал стоить?",
    answer: "1020",
    explanation: "15% от 1200 = 180. Новая цена: 1200 - 180 = 1020 ₽."
  }
];

let currentTask = 0;

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
  });
});

function renderTask() {
  const task = tasks[currentTask];

  const taskTitle = document.getElementById("taskTitle");
  const taskMeta = document.getElementById("taskMeta");
  const taskQuestion = document.getElementById("taskQuestion");
  const answerInput = document.getElementById("answer");
  const result = document.getElementById("result");

  if (!taskTitle || !taskMeta || !taskQuestion || !answerInput || !result) {
    return;
  }

  taskTitle.textContent = task.title;
  taskMeta.textContent = task.subject + " • " + task.topic;
  taskQuestion.textContent = task.question;
  answerInput.value = "";
  result.textContent = "";
}

function checkAnswer() {
  const task = tasks[currentTask];

  const answerInput = document.getElementById("answer");
  const result = document.getElementById("result");

  if (!answerInput || !result) {
    return;
  }

  const value = answerInput.value.trim().replace(",", ".");

  if (value === task.answer) {
    result.style.color = "#22c55e";
    result.textContent = "Верно! " + task.explanation;
  } else {
    result.style.color = "#f87171";
    result.textContent = "Пока неверно. " + task.explanation;
  }
}

function nextTask() {
  currentTask = (currentTask + 1) % tasks.length;
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

  let botAnswer = "Я пока демо-репетитор. Могу объяснить проценты, вероятность и план подготовки.";

  const lowerText = text.toLowerCase();

  if (lowerText.includes("процент")) {
    botAnswer = "Проценты считаются от 100%. Например, если 800 ₽ увеличить на 25%, то 25% = 800 × 0.25 = 200. Ответ: 1000 ₽.";
  }

  if (lowerText.includes("вероят")) {
    botAnswer = "Вероятность = подходящие исходы / все исходы. Например, 4 синих шара из 10: вероятность 4/10 = 0.4.";
  }

  log.innerHTML += '<div class="message bot-msg">' + botAnswer + '</div>';
  input.value = "";
}

renderTask();