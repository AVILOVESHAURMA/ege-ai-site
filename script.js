const tasks = [
  {
    subject: "Математика профиль",
    topic: "Проценты",
    title: "Проценты. Базовая задача",
    question: "Цена товара была 800 ₽. Её увеличили на 25%. Какой стала цена?",
    answer: "1000",
    explanation: "25% от 800 — это 800 × 0,25 = 200. Новая цена: 800 + 200 = 1000 ₽."
  },
  {
    subject: "Математика профиль",
    topic: "Вероятность",
    title: "Вероятность. Шары",
    question: "В коробке 6 красных и 4 синих шара. Какова вероятность достать синий шар?",
    answer: "0.4",
    explanation: "Всего шаров 10. Синих 4. Вероятность = 4/10 = 0,4."
  },
  {
    subject: "Математика база",
    topic: "Проценты",
    title: "Скидка",
    question: "Товар стоил 1200 ₽. После скидки 15% сколько он стал стоить?",
    answer: "1020",
    explanation: "15% от 1200 = 180. Новая цена: 1200 − 180 = 1020 ₽."
  }
];

let currentTask = 0;

function openApp(){
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  window.scrollTo(0, 0);
}

document.querySelectorAll(".nav").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.page).classList.add("active");
  });
});

function renderTask(){
  const task = tasks[currentTask];

  const taskTitle = document.getElementById("taskTitle");
  const taskMeta = document.getElementById("taskMeta");
  const taskQuestion = document.getElementById("taskQuestion");
  const answer = document.getElementById("answer");
  const result = document.getElementById("result");

  if(!taskTitle || !taskQuestion) return;

  taskTitle.textContent = task.title;
  taskMeta.textContent = ${task.subject} • ${task.topic};
  taskQuestion.textContent = task.question;
  answer.value = "";
  result.textContent = "";
}

function checkAnswer(){
  const task = tasks[currentTask];
  const value = document.getElementById("answer").value.trim().replace(",", ".");
  const result = document.getElementById("result");

  if(value === task.answer){
    result.style.color = "#22c55e";
    result.textContent = "Верно! " + task.explanation;
  } else {
    result.style.color = "#f87171";
    result.textContent = "Пока неверно. " + task.explanation;
  }
}

function nextTask(){
  currentTask = (currentTask + 1) % tasks.length;
  renderTask();
}

function sendChat(){
  const input = document.getElementById("chatInput");
  const log = document.getElementById("chatLog");
  const text = input.value.trim();

  if(!text) return;

  log.innerHTML += <div class="message user">${text}</div>;

  let answer = "Я пока демо-репетитор. Но уже могу объяснять проценты, вероятность и план подготовки.";

  if(text.toLowerCase().includes("процент")){
    answer = "Проценты решаются от 100%. Например, если 800 ₽ увеличили на 25%, то 25% = 800 × 0,25 = 200. Ответ: 1000 ₽.";
  }

  if(text.toLowerCase().includes("вероят")){
    answer = "Вероятность = подходящие исходы / все исходы. Например, 4 синих шара из 10: вероятность 4/10 = 0,4.";
  }

  log.innerHTML += <div class="message bot-msg">${answer}</div>;
  input.value = "";
}

renderTask();