const API_URL = "http://localhost:8000/api";

let sections = [];
let currentSection = 0;
let language = "en";
const answers = {};

const options = [
  { value: 0, en: "I don't know", ar: "لا أعلم" },
  { value: 1, en: "Strongly disagree", ar: "لا أوافق بشدة" },
  { value: 2, en: "Disagree", ar: "لا أوافق" },
  { value: 3, en: "Neutral", ar: "محايد" },
  { value: 4, en: "Agree", ar: "أوافق" },
  { value: 5, en: "Strongly agree", ar: "أوافق بشدة" },
];

const translations = {
  en: {
    subtitle: "Your feedback matters.",
    section: "Section",
    of: "of",
    instruction: "Please answer all required questions.",
    comment: "Additional comments (optional)",
    commentPlaceholder: "Share any additional thoughts...",
    textPlaceholder: "Write your response here...",
    optional: "Optional",
    previous: "Previous",
    next: "Next section",
    submit: "Submit survey",
    required: "Please answer all required questions in this section.",
    submitting: "Submitting...",
    success: "Thank you! Your response has been submitted.",
    error: "Unable to submit your response. Please try again.",
    loading: "Loading survey...",
    loadError: "Unable to load the survey. Please try again later.",
  },

  ar: {
    subtitle: "رأيك يهمنا.",
    section: "القسم",
    of: "من",
    instruction: "يرجى الإجابة عن جميع الأسئلة الإلزامية.",
    comment: "ملاحظات إضافية (اختياري)",
    commentPlaceholder: "شاركنا أي أفكار إضافية...",
    textPlaceholder: "اكتب إجابتك هنا...",
    optional: "اختياري",
    previous: "السابق",
    next: "القسم التالي",
    submit: "إرسال الاستبيان",
    required: "يرجى الإجابة عن جميع الأسئلة الإلزامية في هذا القسم.",
    submitting: "جارٍ الإرسال...",
    success: "شكراً لك! تم إرسال إجابتك بنجاح.",
    error: "تعذر إرسال إجابتك. يرجى المحاولة مرة أخرى.",
    loading: "جارٍ تحميل الاستبيان...",
    loadError: "تعذر تحميل الاستبيان. يرجى المحاولة لاحقاً.",
  },
};

const $ = (id) => document.getElementById(id);

function getAllQuestions() {
  return sections.flatMap((section) => section.questions);
}

function getQuestionNumber(questionId) {
  return getAllQuestions().findIndex((q) => q.id === questionId) + 1;
}

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function render() {
  if (!sections.length || !sections[currentSection]) {
    console.error("Survey sections are missing or invalid.");
    return;
  }

  const t = translations[language];
  const section = sections[currentSection];
  const isRTL = language === "ar";

  document.documentElement.lang = language;
  document.documentElement.dir = isRTL ? "rtl" : "ltr";

  // $("survey-title").textContent = "INAYA Survey";
  // $("survey-subtitle").textContent  = t.subtitle;
  $("language-toggle").textContent = isRTL ? "English" : "العربية";

  const answeredSections = sections
    .slice(0, currentSection)
    .reduce((sum, s) => sum + s.questions.length, 0);

  const total = getAllQuestions().length;

  const completedQuestions = sections
    .slice(0, currentSection)
    .reduce((sum, s) => sum + s.questions.length, 0);

  const progress = Math.round((completedQuestions / total) * 100);

  console.log({
    progress: $("progress"),
    surveyContent: $("survey-content"),
    navigation: $("navigation"),
    message: $("message"),
    surveyApp: $("survey-app"),
  });

  $("progress").innerHTML = `
    <div class="progress-label">
      <span>${t.section} ${currentSection + 1} ${t.of} ${sections.length}</span>
      <span>${progress}%</span>
    </div>

    <div class="progress-track">
      <div class="progress-fill" style="width:${progress}%"></div>
    </div>
  `;

  let html = `
    <h2 class="section-title">
      ${escapeHTML(section[`title_${language}`])}
    </h2>

    <p class="section-description">${t.instruction}</p>
  `;

  section.questions.forEach((question) => {
    const number = getQuestionNumber(question.id);
    const saved = answers[question.id] || {};

    html += `
      <div class="question" id="question-${question.id}">
        <p class="question-title">
          ${number}. ${escapeHTML(question[language])}

          ${
            question.type === "likert"
              ? `<span class="required-indicator">
                  * ${language === "ar" ? "مطلوب" : "Required"}
                </span>`
              : `<span class="optional-indicator">
                  ${t.optional}
                </span>`
          }
        </p>
    `;

    if (question.type === "likert") {
      html += `<div class="options">`;

      options.forEach((option) => {
        const checked = saved.answerValue === option.value ? "checked" : "";

        html += `
          <label class="option">
            <input
              type="radio"
              name="q${question.id}"
              value="${option.value}"
              ${checked}
            >
            <span>${option[language]}</span>
          </label>
        `;
      });

      html += `
        </div>

        <label class="comment-label" for="comment-${question.id}">
          ${t.comment}
        </label>

        <textarea
          id="comment-${question.id}"
          class="comment-input"
          maxlength="2000"
          rows="2"
          placeholder="${t.commentPlaceholder}"
        >${escapeHTML(saved.comment || "")}</textarea>
      `;
    } else if (question.type === "text") {
      html += `
        <label class="optional-label">${t.optional}</label>

        <textarea
          id="text-${question.id}"
          class="text-input"
          maxlength="5000"
          rows="5"
          placeholder="${t.textPlaceholder}"
        >${escapeHTML(saved.answerText || "")}</textarea>
      `;
    }

    html += `</div>`;
  });

  $("survey-content").innerHTML = html;

  $("survey-content").animate(
    [
      {
        opacity: 0,
        transform: "translateY(10px)",
      },
      {
        opacity: 1,
        transform: "translateY(0)",
      },
    ],
    {
      duration: 300,
      easing: "ease-out",
    },
  );

  bindQuestionEvents();

  $("navigation").innerHTML = `
    <div class="navigation">
      <button
        class="nav-btn secondary"
        id="previous-btn"
        ${currentSection === 0 ? "disabled" : ""}
      >${t.previous}</button>

      <button class="nav-btn" id="next-btn">
        ${currentSection === sections.length - 1 ? t.submit : t.next}
      </button>
    </div>
  `;

  $("previous-btn").addEventListener("click", () => {
    currentSection--;
    $("message").textContent = "";

    render();

    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("next-btn").addEventListener("click", async () => {
    saveCurrentSection();

    if (!validateSection()) return;

    if (currentSection < sections.length - 1) {
      currentSection++;
      $("message").textContent = "";

      render();

      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await submitSurvey();
    }
  });
}

function bindQuestionEvents() {
  sections[currentSection].questions.forEach((question) => {
    if (question.type === "likert") {
      document
        .querySelectorAll(`input[name="q${question.id}"]`)
        .forEach((input) => {
          input.addEventListener("change", (event) => {
            answers[question.id] ||= {};

            answers[question.id].answerValue = Number(event.target.value);
          });
        });
    }
  });
}

function saveCurrentSection() {
  sections[currentSection].questions.forEach((question) => {
    answers[question.id] ||= {};

    if (question.type === "likert") {
      const selected = document.querySelector(
        `input[name="q${question.id}"]:checked`,
      );

      const comment = $(`comment-${question.id}`);

      if (selected) {
        answers[question.id].answerValue = Number(selected.value);
      }

      if (comment) {
        answers[question.id].comment = comment.value.trim();
      }
    } else if (question.type === "text") {
      const input = $(`text-${question.id}`);

      if (input) {
        answers[question.id].answerText = input.value.trim();
      }
    }
  });
}

function validateSection() {
  const section = sections[currentSection];

  document.querySelectorAll(".question").forEach((question) => {
    question.classList.remove("validation-error");
  });

  for (const question of section.questions) {
    if (
      question.type === "likert" &&
      !Number.isInteger(answers[question.id]?.answerValue)
    ) {
      const element = $(`question-${question.id}`);

      element?.classList.add("validation-error");

      $("message").textContent = translations[language].required;

      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return false;
    }
  }

  return true;
}

async function submitSurvey() {
  saveCurrentSection();

  const button = $("next-btn");
  const t = translations[language];

  button.disabled = true;
  button.textContent = t.submitting;

  try {
    const payload = {
      language,

      answers: getAllQuestions().map((question) => {
        const saved = answers[question.id] || {};

        return {
          questionId: question.id,

          answerValue:
            question.type === "likert" ? (saved.answerValue ?? null) : null,

          answerText:
            question.type === "text" ? (saved.answerText ?? null) : null,

          comment: question.type === "likert" ? (saved.comment ?? null) : null,
        };
      }),
    };

    const response = await fetch(`${API_URL}/submit.php`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.code || "submission_failed");
    }

    $("survey-app").innerHTML = `
      <div class="success">
        <h2>${t.success}</h2>
      </div>
    `;
  } catch (error) {
    console.error("Survey submission failed:", error);

    $("message").textContent = t.error;

    button.disabled = false;
    button.textContent = t.submit;
  }
}

$("language-toggle").addEventListener("click", () => {
  if (!sections.length) return;

  saveCurrentSection();

  language = language === "en" ? "ar" : "en";

  render();
});

async function loadQuestions() {
  const app = $("survey-app");

  try {
    $("survey-content").innerHTML = `<p>${translations[language].loading}</p>`;

    const response = await fetch(`${API_URL}/questions.php`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (
      !result.success ||
      !Array.isArray(result.sections) ||
      result.sections.length === 0
    ) {
      throw new Error("Invalid survey configuration");
    }

    sections = result.sections;

    render();
  } catch (error) {
    console.error("Survey loading failed:", error);

    $("survey-content").innerHTML = `
      <p>${translations[language].loadError}</p>
    `;
  }
}

loadQuestions();

function checkElements() {
  const ids = [
    "survey-title",
    "survey-subtitle",
    "language-toggle",
    "survey-app",
    "progress",
    "survey-content",
    "navigation",
    "message",
  ];

  ids.forEach((id) => {
    console.log(`${id}:`, $(id) ? "FOUND" : "MISSING");
  });
}

checkElements();
