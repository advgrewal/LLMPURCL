"use strict";

/* =========================================================
   LLM CAMPUS - APP.JS
   ========================================================= */

/* ---------- Check timetable data ---------- */

if (
  typeof window.TIMETABLE === "undefined" ||
  !window.TIMETABLE.days ||
  !window.TIMETABLE.slots
) {
  document.body.innerHTML =
    '<div style="padding:30px;font-family:Arial"><h2>LLM Campus</h2><p>Timetable data could not be loaded.</p><p>Check that <b>assets/data.js</b> exists and is loading.</p></div>';

  throw new Error(
    "TIMETABLE data is missing. Check assets/data.js"
  );
}

const timetable = window.TIMETABLE;

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday"
];

/* ---------- Today ---------- */

function getTodayName() {
  const names = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  return names[new Date().getDay()];
}

function getSelectedDay() {
  const today = getTodayName();

  if (days.indexOf(today) !== -1) {
    return today;
  }

  return "Monday";
}

let selectedDay = getSelectedDay();
let activeView = "today";

/* ---------- Helpers ---------- */

function getElement(id) {
  return document.getElementById(id);
}

function minutesFromTime(time) {
  const parts = time.split(":");

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  return hours * 60 + minutes;
}

function formatTime(time) {
  const parts = time.split(":");

  let hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;

  if (hours === 0) {
    hours = 12;
  }

  return (
    hours +
    ":" +
    String(minutes).padStart(2, "0") +
    " " +
    period
  );
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- Greeting ---------- */

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

/* ---------- Lecture status ---------- */

function getLectureStatus(day, index) {

  if (day !== getTodayName()) {
    return "future";
  }

  const slot = timetable.slots[index];

  if (!slot) {
    return "future";
  }

  const now = new Date();

  const current =
    now.getHours() * 60 +
    now.getMinutes();

  const start = minutesFromTime(slot.start);
  const end = minutesFromTime(slot.end);

  if (current >= start && current < end) {
    return "now";
  }

  if (current >= end) {
    return "done";
  }

  return "up";
}

/* ---------- Toast ---------- */

function showToast(message) {

  const toast = getElement("toast");

  if (!toast) {
    return;
  }

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 1800);
}

/* =========================================================
   HEADER
   ========================================================= */

function renderHeader() {

  const dateElement =
    getElement("todayDate");

  const greetingElement =
    getElement("greeting");

  const nextCard =
    getElement("nextCard");

  const now = new Date();

  if (dateElement) {

    dateElement.textContent =
      now.toLocaleDateString(
        "en-IN",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      );
  }

  if (greetingElement) {
    greetingElement.textContent =
      getGreeting();
  }

  if (!nextCard) {
    return;
  }

  const lectures =
    timetable.days[selectedDay] || [];

  let lectureIndex = -1;

  let label = "SELECTED DAY";

  if (selectedDay === getTodayName()) {

    lectureIndex =
      lectures.findIndex(function (_, index) {

        return (
          getLectureStatus(
            selectedDay,
            index
          ) === "now"
        );

      });

    if (lectureIndex === -1) {

      lectureIndex =
        lectures.findIndex(function (_, index) {

          return (
            getLectureStatus(
              selectedDay,
              index
            ) === "up"
          );

        });

      if (lectureIndex !== -1) {
        label = "NEXT";
      }

    } else {

      label = "NOW";
    }

  } else {

    if (lectures.length > 0) {
      lectureIndex = 0;
    }
  }

  if (lectureIndex === -1) {

    nextCard.innerHTML =
      '<div class="label">TODAY</div>' +
      '<h3>Classes finished</h3>' +
      '<p>You are done for the day.</p>';

    return;
  }

  const lecture =
    lectures[lectureIndex];

  const slot =
    timetable.slots[lectureIndex];

  let room = "";

  if (lecture[2]) {

    room =
      " • " +
      escapeHTML(lecture[2]);
  }

  nextCard.innerHTML =
    '<div class="label">' +
    label +
    "</div>" +

    "<h3>" +
    escapeHTML(lecture[0]) +
    "</h3>" +

    "<p>" +
    formatTime(slot.start) +
    " – " +
    formatTime(slot.end) +
    "</p>" +

    "<p>" +
    escapeHTML(lecture[1]) +
    room +
    "</p>";
}

/* =========================================================
   DAY BUTTONS
   ========================================================= */

function renderDayButtons() {

  const container =
    getElement("dayTabs");

  if (!container) {
    return;
  }

  let html = "";

  days.forEach(function (day) {

    const active =
      day === selectedDay
        ? "active"
        : "";

    html +=
      '<button type="button" class="' +
      active +
      '" data-day="' +
      escapeHTML(day) +
      '">' +
      escapeHTML(day.substring(0, 3)) +
      "</button>";
  });

  container.innerHTML = html;

  const buttons =
    container.querySelectorAll("button");

  buttons.forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        selectedDay =
          button.getAttribute("data-day");

        setView("today");

        render();
      }
    );

  });
}

/* =========================================================
   TODAY / DAILY TIMETABLE
   ========================================================= */

function renderSchedule() {

  const title =
    getElement("scheduleTitle");

  const schedule =
    getElement("schedule");

  if (!schedule) {
    return;
  }

  if (title) {

    title.textContent =
      selectedDay +
      " lectures";
  }

  const lectures =
    timetable.days[selectedDay] || [];

  if (lectures.length === 0) {

    schedule.innerHTML =
      '<div class="card">' +
      '<p class="muted">No lectures scheduled.</p>' +
      "</div>";

    return;
  }

  let html = "";

  lectures.forEach(function (
    lecture,
    index
  ) {

    const slot =
      timetable.slots[index];

    if (!slot) {
      return;
    }

    const status =
      getLectureStatus(
        selectedDay,
        index
      );

    let badge = "UPCOMING";

    if (status === "now") {
      badge = "NOW";
    }

    if (status === "done") {
      badge = "DONE";
    }

    let room = "";

    if (lecture[2]) {

      room =
        '<span class="room">' +
        escapeHTML(lecture[2]) +
        "</span>";
    }

    html +=
      '<article class="lecture ' +
      status +
      '">' +

      '<div class="time">' +
      formatTime(slot.start) +
      '<small>to ' +
      formatTime(slot.end) +
      "</small>" +
      "</div>" +

      "<div>" +

      '<div class="subject-name">' +
      escapeHTML(lecture[0]) +
      "</div>" +

      '<div class="faculty">' +
      escapeHTML(lecture[1]) +
      "</div>" +

      room +

      "</div>" +

      '<span class="badge ' +
      status +
      '">' +
      badge +
      "</span>" +

      "</article>";
  });

  schedule.innerHTML = html;
}

/* =========================================================
   SUBJECTS
   ========================================================= */

function getSubjects() {

  const subjectList = [];

  days.forEach(function (day) {

    const lectures =
      timetable.days[day] || [];

    lectures.forEach(function (lecture) {

      if (
        subjectList.indexOf(
          lecture[0]
        ) === -1
      ) {

        subjectList.push(
          lecture[0]
        );
      }

    });

  });

  return subjectList;
}

/* =========================================================
   ATTENDANCE STORAGE
   ========================================================= */

function getAttendance() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "llm_attendance"
      ) || "{}"
    );

  } catch (error) {

    return {};
  }
}

function getAttendanceTotal() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "llm_attendance_total"
      ) || "{}"
    );

  } catch (error) {

    return {};
  }
}

/* =========================================================
   STATISTICS
   ========================================================= */

function renderStats() {

  const container =
    getElement("stats");

  if (!container) {
    return;
  }

  const lectures =
    timetable.days[selectedDay] || [];

  let termPaperCount = 0;

  lectures.forEach(function (lecture) {

    if (lecture[0] === "Term Paper") {
      termPaperCount++;
    }

  });

  const attendance =
    getAttendance();

  const totals =
    getAttendanceTotal();

  let present = 0;
  let total = 0;

  Object.keys(attendance)
    .forEach(function (subject) {

      present +=
        Number(
          attendance[subject] || 0
        );

    });

  Object.keys(totals)
    .forEach(function (subject) {

      total +=
        Number(
          totals[subject] || 0
        );

    });

  let percentage = 0;

  if (total > 0) {

    percentage =
      Math.round(
        (present / total) * 100
      );
  }

  container.innerHTML =

    '<div class="stat">' +
    "<strong>" +
    lectures.length +
    "</strong>" +
    "<span>lecture slots</span>" +
    "</div>" +

    '<div class="stat">' +
    "<strong>" +
    termPaperCount +
    "</strong>" +
    "<span>term paper slots</span>" +
    "</div>" +

    '<div class="stat">' +
    "<strong>" +
    percentage +
    "%</strong>" +
    "<span>attendance tracked</span>" +
    "</div>";
}

/* =========================================================
   SUBJECT VIEW
   ========================================================= */

function renderSubjects() {

  const container =
    getElement("subjects");

  if (!container) {
    return;
  }

  const subjects =
    getSubjects();

  const attendance =
    getAttendance();

  const totals =
    getAttendanceTotal();

  let html = "";

  subjects.forEach(function (subject) {

    const present =
      Number(
        attendance[subject] || 0
      );

    const total =
      Number(
        totals[subject] || 0
      );

    let percentage = 0;

    if (total > 0) {

      percentage =
        Math.round(
          (present / total) * 100
        );
    }

    let weeklyDays = 0;

    days.forEach(function (day) {

      const lectures =
        timetable.days[day] || [];

      const found =
        lectures.some(function (lecture) {

          return lecture[0] === subject;

        });

      if (found) {
        weeklyDays++;
      }

    });

    html +=

      '<div class="card">' +

      "<h3>" +
      escapeHTML(subject) +
      "</h3>" +

      "<p>" +
      weeklyDays +
      " day" +
      (weeklyDays === 1 ? "" : "s") +
      " per week" +
      "</p>" +

      '<div class="progress">' +
      '<i style="width:' +
      Math.min(100, percentage) +
      '%"></i>' +
      "</div>" +

      "<p><b>" +
      percentage +
      "%</b> attendance • " +
      present +
      "/" +
      total +
      " marked</p>" +

      "</div>";
  });

  container.innerHTML = html;
}

/* =========================================================
   ATTENDANCE VIEW
   ========================================================= */

function renderAttendance() {

  const container =
    getElement("attendance");

  if (!container) {
    return;
  }

  const subjects =
    getSubjects();

  const attendance =
    getAttendance();

  const totals =
    getAttendanceTotal();

  let html = "";

  subjects.forEach(function (subject) {

    const present =
      Number(
        attendance[subject] || 0
      );

    const total =
      Number(
        totals[subject] || 0
      );

    let percentage = 0;

    if (total > 0) {

      percentage =
        Math.round(
          (present / total) * 100
        );
    }

    html +=

      '<div class="card">' +

      '<div class="att-row">' +

      "<div>" +

      "<h3>" +
      escapeHTML(subject) +
      "</h3>" +

      '<div class="progress">' +
      '<i style="width:' +
      Math.min(100, percentage) +
      '%"></i>' +
      "</div>" +

      "<p>" +
      present +
      "/" +
      total +
      " present • " +
      percentage +
      "%</p>" +

      "</div>" +

      '<div class="att-actions">' +

      '<button type="button" ' +
      'data-subject="' +
      escapeHTML(subject) +
      '" ' +
      'data-value="present">' +
      "Present" +
      "</button>" +

      '<button type="button" ' +
      'data-subject="' +
      escapeHTML(subject) +
      '" ' +
      'data-value="absent">' +
      "Absent" +
      "</button>" +

      "</div>" +

      "</div>" +

      "</div>";
  });

  container.innerHTML = html;

  const buttons =
    container.querySelectorAll(
      "button[data-subject]"
    );

  buttons.forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        const subject =
          button.getAttribute(
            "data-subject"
          );

        const value =
          button.getAttribute(
            "data-value"
          );

        markAttendance(
          subject,
          value === "present"
        );
      }
    );

  });
}

/* =========================================================
   MARK ATTENDANCE
   ========================================================= */

function markAttendance(
  subject,
  present
) {

  const attendance =
    getAttendance();

  const totals =
    getAttendanceTotal();

  if (
    typeof attendance[subject] !==
    "number"
  ) {

    attendance[subject] = 0;
  }

  if (
    typeof totals[subject] !==
    "number"
  ) {

    totals[subject] = 0;
  }

  totals[subject]++;

  if (present) {
    attendance[subject]++;
  }

  localStorage.setItem(
    "llm_attendance",
    JSON.stringify(attendance)
  );

  localStorage.setItem(
    "llm_attendance_total",
    JSON.stringify(totals)
  );

  render();

  showToast(
    present
      ? "Attendance marked present"
      : "Attendance marked absent"
  );
}

/* =========================================================
   WEEK VIEW
   ========================================================= */

function renderWeek() {

  const container =
    getElement("week");

  if (!container) {
    return;
  }

  let html =
    '<div class="week-table">' +
    '<div class="week-grid">';

  html +=
    '<div class="week-head">Day</div>';

  timetable.slots.forEach(function (slot) {

    html +=
      '<div class="week-head">' +
      formatTime(slot.start) +
      "</div>";
  });

  days.forEach(function (day) {

    html +=
      '<div class="week-day">' +
      escapeHTML(day) +
      "</div>";

    const lectures =
      timetable.days[day] || [];

    timetable.slots.forEach(
      function (slot, index) {

        const lecture =
          lectures[index];

        if (!lecture) {

          html +=
            '<div><span class="muted">—</span></div>';

          return;
        }

        html +=
          "<div>" +

          "<b>" +
          escapeHTML(lecture[0]) +
          "</b>" +

          "<br>" +

          '<span class="muted">' +
          escapeHTML(
            lecture[2] || ""
          ) +
          "</span>" +

          "</div>";
      }
    );

  });

  html +=
    "</div></div>";

  container.innerHTML = html;
}

/* =========================================================
   NOTES
   ========================================================= */

function loadNotes() {

  const notes =
    getElement("notes");

  if (!notes) {
    return;
  }

  notes.value =
    localStorage.getItem(
      "llm_notes"
    ) || "";
}

function saveNotes() {

  const notes =
    getElement("notes");

  if (!notes) {
    return;
  }

  localStorage.setItem(
    "llm_notes",
    notes.value
  );

  showToast(
    "Notes saved on this device"
  );
}

/* =========================================================
   VIEW MANAGEMENT
   ========================================================= */

function setView(view) {

  activeView = view;

  const sections = {

    today:
      getElement("todaySection"),

    week:
      getElement("weekSection"),

    subjects:
      getElement("subjectsSection"),

    attendance:
      getElement("attendanceSection"),

    notes:
      getElement("notesSection")

  };

  Object.keys(sections)
    .forEach(function (name) {

      const section =
        sections[name];

      if (!section) {
        return;
      }

      if (name === view) {

        section.classList.remove(
          "hidden"
        );

      } else {

        section.classList.add(
          "hidden"
        );
      }

    });

  const navigationButtons =
    document.querySelectorAll(
      ".nav-item"
    );

  navigationButtons.forEach(
    function (button) {

      if (
        button.getAttribute(
          "data-view"
        ) === view
      ) {

        button.classList.add(
          "active"
        );

      } else {

        button.classList.remove(
          "active"
        );
      }

    }
  );

  if (view === "notes") {
    loadNotes();
  }
}

/* =========================================================
   MAIN RENDER
   ========================================================= */

function render() {

  renderHeader();

  renderDayButtons();

  renderSchedule();

  renderStats();

  renderSubjects();

  renderAttendance();

  renderWeek();
}

/* =========================================================
   BUTTON EVENTS
   ========================================================= */

const refreshButton =
  getElement("refreshBtn");

if (refreshButton) {

  refreshButton.addEventListener(
    "click",
    function () {

      render();

      showToast(
        "Timetable updated"
      );

    }
  );
}

const resetAttendanceButton =
  getElement("resetAttendance");

if (resetAttendanceButton) {

  resetAttendanceButton.addEventListener(
    "click",
    function () {

      const confirmed =
        window.confirm(
          "Reset all attendance records?"
        );

      if (!confirmed) {
        return;
      }

      localStorage.removeItem(
        "llm_attendance"
      );

      localStorage.removeItem(
        "llm_attendance_total"
      );

      render();

      showToast(
        "Attendance reset"
      );
    }
  );
}

const saveNotesButton =
  getElement("saveNotes");

if (saveNotesButton) {

  saveNotesButton.addEventListener(
    "click",
    saveNotes
  );
}

/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

const navigationButtons =
  document.querySelectorAll(
    ".nav-item"
  );

navigationButtons.forEach(
  function (button) {

    button.addEventListener(
      "click",
      function () {

        const view =
          button.getAttribute(
            "data-view"
          );

        if (view) {
          setView(view);
        }

      }
    );

  }
);

/* =========================================================
   PWA INSTALL
   ========================================================= */

let installPrompt = null;

window.addEventListener(
  "beforeinstallprompt",
  function (event) {

    event.preventDefault();

    installPrompt = event;

    const installButton =
      getElement("installBtn");

    if (installButton) {
      installButton.hidden = false;
    }

  }
);

const installButton =
  getElement("installBtn");

if (installButton) {

  installButton.addEventListener(
    "click",
    async function () {

      if (!installPrompt) {
        return;
      }

      installPrompt.prompt();

      try {

        await installPrompt.userChoice;

      } catch (error) {

        console.log(
          "Install prompt closed."
        );
      }

      installPrompt = null;

      installButton.hidden = true;
    }
  );
}

/* =========================================================
   SERVICE WORKER
   ========================================================= */

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    function () {

      navigator.serviceWorker
        .register("./sw.js")
        .then(function (registration) {

          console.log(
            "LLM Campus service worker registered:",
            registration.scope
          );

        })
        .catch(function (error) {

          console.error(
            "Service worker registration failed:",
            error
          );

        });

    }
  );
}

/* =========================================================
   START
   ========================================================= */

render();

setView("today");

/*
   Update live lecture status every minute.
*/

setInterval(
  function () {

    renderHeader();
    renderSchedule();
    renderStats();

  },
  60000
);
