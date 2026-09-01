```javascript
/* =========================================================
   LLM CAMPUS - MAIN APPLICATION
   ========================================================= */

"use strict";

/* ---------------------------------------------------------
   1. TIMETABLE DATA
   --------------------------------------------------------- */

const T = window.TIMETABLE;

if (!T || !T.days || !T.slots) {
  console.error("LLM Campus: timetable data could not be loaded.");
  throw new Error(
    "TIMETABLE data is missing. Check that assets/data.js exists and loads before app.js."
  );
}

/* ---------------------------------------------------------
   2. CONSTANTS
   --------------------------------------------------------- */

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday"
];

const SUBJECTS = [
  ...new Set(
    DAYS.flatMap(day =>
      (T.days[day] || []).map(item => item[0])
    )
  )
];

/* ---------------------------------------------------------
   3. DOM HELPERS
   --------------------------------------------------------- */

const $ = selector => document.querySelector(selector);

const $$ = selector => [
  ...document.querySelectorAll(selector)
];

/* ---------------------------------------------------------
   4. TIME FUNCTIONS
   --------------------------------------------------------- */

function mins(time) {
  const parts = String(time).split(":").map(Number);

  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;

  return hours * 60 + minutes;
}

function fmt(time) {
  const parts = String(time).split(":").map(Number);

  let hours = parts[0] || 0;
  const minutes = parts[1] || 0;

  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
}

/* ---------------------------------------------------------
   5. TODAY
   IMPORTANT:
   todayName() MUST be defined before getTodayDay()
   is called.
   --------------------------------------------------------- */

function todayName() {
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

function getTodayDay() {
  const day = todayName();

  /*
    College timetable currently contains Monday-Friday.

    If today is Saturday or Sunday, default to Monday
    so that the application still has something useful
    to display.
  */

  if (DAYS.includes(day)) {
    return day;
  }

  return "Monday";
}

/* ---------------------------------------------------------
   6. APPLICATION STATE
   --------------------------------------------------------- */

let selectedDay = getTodayDay();

let activeView = "today";

let deferredInstall = null;

/* ---------------------------------------------------------
   7. GREETING
   --------------------------------------------------------- */

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

/* ---------------------------------------------------------
   8. ESCAPE HTML
   --------------------------------------------------------- */

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------------------------------------------------
   9. ESCAPE ATTRIBUTE
   --------------------------------------------------------- */

function escapeAttribute(value) {
  return escapeHTML(value);
}

/* ---------------------------------------------------------
   10. LECTURE STATUS
   --------------------------------------------------------- */

function nowStatus(day, index) {

  /*
    If viewing another day, don't pretend its classes
    are happening now.
  */

  if (day !== getTodayDay()) {
    return "future";
  }

  const lecture = T.slots[index];

  if (!lecture) {
    return "future";
  }

  const now = new Date();

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const start = mins(lecture.start);
  const end = mins(lecture.end);

  if (
    currentMinutes >= start &&
    currentMinutes < end
  ) {
    return "now";
  }

  if (currentMinutes >= end) {
    return "done";
  }

  return "up";
}

/* ---------------------------------------------------------
   11. TOAST
   --------------------------------------------------------- */

function showToast(message) {

  const toast = $("#toast");

  if (!toast) {
    return;
  }

  toast.textContent = message;

  toast.classList.add("show");

  window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

/* ---------------------------------------------------------
   12. HEADER
   --------------------------------------------------------- */

function renderHeader() {

  const dateElement = $("#todayDate");
  const greetingElement = $("#greeting");
  const nextCard = $("#nextCard");

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
    greetingElement.textContent = greeting();
  }

  if (!nextCard) {
    return;
  }

  const lectures =
    T.days[selectedDay] || [];

  let index = -1;
  let label = "SELECTED DAY";

  /*
    For today's actual timetable, identify NOW or NEXT.
  */

  if (selectedDay === getTodayDay()) {

    index = lectures.findIndex(
      (_, i) =>
        nowStatus(selectedDay, i) === "now"
    );

    if (index >= 0) {

      label = "NOW";

    } else {

      index = lectures.findIndex(
        (_, i) =>
          nowStatus(selectedDay, i) === "up"
      );

      if (index >= 0) {
        label = "NEXT";
      }
    }

  } else {

    /*
      When another day is selected, show its
      first lecture rather than calling it "NOW".
    */

    index = lectures.length > 0 ? 0 : -1;
    label = "SELECTED DAY";
  }

  if (index >= 0) {

    const lecture = lectures[index];
    const slot = T.slots[index];

    const subject = escapeHTML(lecture[0]);
    const faculty = escapeHTML(lecture[1]);

    const room =
      lecture[2]
        ? ` • ${escapeHTML(lecture[2])}`
        : "";

    nextCard.innerHTML = `
      <div class="label">${label}</div>

      <h3>${subject}</h3>

      <p>
        ${fmt(slot.start)}
        –
        ${fmt(slot.end)}
      </p>

      <p>
        ${faculty}${room}
      </p>
    `;

  } else {

    nextCard.innerHTML = `
      <div class="label">TODAY</div>

      <h3>Classes finished</h3>

      <p>You're done for the day.</p>
    `;
  }
}

/* ---------------------------------------------------------
   13. DAY TABS
   --------------------------------------------------------- */

function renderTabs() {

  const container = $("#dayTabs");

  if (!container) {
    return;
  }

  container.innerHTML =
    DAYS.map(day => {

      const active =
        day === selectedDay
          ? "active"
          : "";

      return `
        <button
          type="button"
          class="${active}"
          data-day="${escapeAttribute(day)}"
        >
          ${escapeHTML(day.slice(0, 3))}
        </button>
      `;

    }).join("");

  $$("#dayTabs button").forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectedDay =
          button.dataset.day;

        setView("today");

        render();
      }
    );

  });
}

/* ---------------------------------------------------------
   14. TODAY / DAY SCHEDULE
   --------------------------------------------------------- */

function renderToday() {

  const title = $("#scheduleTitle");
  const schedule = $("#schedule");

  if (!schedule) {
    return;
  }

  if (title) {
    title.textContent =
      `${selectedDay} lectures`;
  }

  const lectures =
    T.days[selectedDay] || [];

  if (!lectures.length) {

    schedule.innerHTML = `
      <div class="card">
        <p class="muted">
          No lectures scheduled.
        </p>
      </div>
    `;

    return;
  }

  schedule.innerHTML =
    lectures.map((lecture, index) => {

      const slot = T.slots[index];

      if (!slot) {
        return "";
      }

      const status =
        nowStatus(
          selectedDay,
          index
        );

      let badgeText = "UPCOMING";

      if (status === "now") {
        badgeText = "NOW";
      }

      if (status === "done") {
        badgeText = "DONE";
      }

      const room =
        lecture[2]
          ? `
            <span class="room">
              ${escapeHTML(lecture[2])}
            </span>
          `
          : "";

      return `
        <article class="lecture ${status}">

          <div class="time">
            ${fmt(slot.start)}

            <small>
              to ${fmt(slot.end)}
            </small>
          </div>

          <div>

            <div class="subject-name">
              ${escapeHTML(lecture[0])}
            </div>

            <div class="faculty">
              ${escapeHTML(lecture[1])}
            </div>

            ${room}

          </div>

          <span class="badge ${status}">
            ${badgeText}
          </span>

        </article>
      `;

    }).join("");
}

/* ---------------------------------------------------------
   15. ATTENDANCE STORAGE
   --------------------------------------------------------- */

function getAttendance() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "llm_attendance"
      ) || "{}"
    );

  } catch (error) {

    console.error(
      "Could not read attendance:",
      error
    );

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

    console.error(
      "Could not read attendance totals:",
      error
    );

    return {};
  }
}

/* ---------------------------------------------------------
   16. STATISTICS
   --------------------------------------------------------- */

function renderStats() {

  const container = $("#stats");

  if (!container) {
    return;
  }

  const lectures =
    T.days[selectedDay] || [];

  const termPaperCount =
    lectures.filter(
      lecture =>
        lecture[0] === "Term Paper"
    ).length;

  const present =
    Object.values(
      getAttendance()
    ).reduce(
      (sum, value) =>
        sum + Number(value || 0),
      0
    );

  const total =
    Object.values(
      getAttendanceTotal()
    ).reduce(
      (sum, value) =>
        sum + Number(value || 0),
      0
    );

  const percentage =
    total > 0
      ? Math.round(
          (present / total) * 100
        )
      : 0;

  container.innerHTML = `

    <div class="stat">
      <strong>
        ${lectures.length}
      </strong>
      <span>
        lecture slots
      </span>
    </div>

    <div class="stat">
      <strong>
        ${termPaperCount}
      </strong>
      <span>
        term paper slots
      </span>
    </div>

    <div class="stat">
      <strong>
        ${percentage}%
      </strong>
      <span>
        attendance tracked
      </span>
    </div>

  `;
}

/* ---------------------------------------------------------
   17. SUBJECTS
   --------------------------------------------------------- */

function renderSubjects() {

  const container = $("#subjects");

  if (!container) {
    return;
  }

  const totals =
    getAttendanceTotal();

  const presents =
    getAttendance();

  container.innerHTML =
    SUBJECTS.map(subject => {

      const total =
        Number(totals[subject] || 0);

      const present =
        Number(presents[subject] || 0);

      const percentage =
        total > 0
          ? Math.round(
              (present / total) * 100
            )
          : 0;

      const dayCount =
        DAYS.filter(day =>
          (T.days[day] || []).some(
            lecture =>
              lecture[0] === subject
          )
        ).length;

      return `
        <div class="card">

          <h3>
            ${escapeHTML(subject)}
          </h3>

          <p>
            ${dayCount}
            day${dayCount !== 1 ? "s" : ""}
            per week
          </p>

          <div class="progress">
            <i
              style="width:${Math.min(
                100,
                percentage
              )}%"
            ></i>
          </div>

          <p>
            <b>${percentage}%</b>
            attendance
            •
            ${present}/${total}
            marked
          </p>

        </div>
      `;

    }).join("");
}

/* ---------------------------------------------------------
   18. ATTENDANCE
   --------------------------------------------------------- */

function renderAttendance() {

  const container = $("#attendance");

  if (!container) {
    return;
  }

  const presents =
    getAttendance();

  const totals =
    getAttendanceTotal();

  container.innerHTML =
    SUBJECTS.map(subject => {

      const total =
        Number(totals[subject] || 0);

      const present =
        Number(presents[subject] || 0);

      const percentage =
        total > 0
          ? Math.round(
              (present / total) * 100
            )
          : 0;

      return `
        <div class="card">

          <div class="att-row">

            <div>

              <h3>
                ${escapeHTML(subject)}
              </h3>

              <div class="progress">
                <i
                  style="width:${Math.min(
                    100,
                    percentage
                  )}%"
                ></i>
              </div>

              <p>
                ${present}/${total}
                present
                •
                ${percentage}%
              </p>

            </div>

            <div class="att-actions">

              <button
                type="button"
                class="present"
                data-attendance-subject="${escapeAttribute(subject)}"
                data-attendance-value="present"
              >
                Present
              </button>

              <button
                type="button"
                data-attendance-subject="${escapeAttribute(subject)}"
                data-attendance-value="absent"
              >
                Absent
              </button>

            </div>

          </div>

        </div>
      `;

    }).join("");

  /*
    Attach buttons after generating HTML.
  */

  $$("#attendance [data-attendance-subject]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const subject =
            button.dataset.attendanceSubject;

          const present =
            button.dataset.attendanceValue ===
            "present";

          markAttendance(
            subject,
            present
          );

        }
      );

    });
}

/* ---------------------------------------------------------
   19. MARK ATTENDANCE
   --------------------------------------------------------- */

function markAttendance(
  subject,
  wasPresent
) {

  const attendance =
    getAttendance();

  const totals =
    getAttendanceTotal();

  if (!attendance[subject]) {
    attendance[subject] = 0;
  }

  if (!totals[subject]) {
    totals[subject] = 0;
  }

  /*
    Every click records one lecture.
  */

  totals[subject] += 1;

  if (wasPresent) {
    attendance[subject] += 1;
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
    wasPresent
      ? "Attendance marked present"
      : "Attendance marked absent"
  );
}

/* ---------------------------------------------------------
   20. WEEK VIEW
   --------------------------------------------------------- */

function renderWeek() {

  const container = $("#week");

  if (!container) {
    return;
  }

  let html = `
    <div class="week-table">

      <div class="week-grid">

        <div class="week-head">
          Day
        </div>
  `;

  T.slots.forEach(slot => {

    html += `
      <div class="week-head">
        ${fmt(slot.start)}
      </div>
    `;

  });

  html += "</div>";

  /*
    Re-create grid rows.
  */

  let rows = `
    <div class="week-grid">
      <div class="week-head">
        Day
      </div>
  `;

  T.slots.forEach(slot => {

    rows += `
      <div class="week-head">
        ${fmt(slot.start)}
      </div>
    `;

  });

  DAYS.forEach(day => {

    rows += `
      <div class="week-day">
        ${escapeHTML(day)}
      </div>
    `;

    const lectures =
      T.days[day] || [];

    T.slots.forEach((slot, index) => {

      const lecture =
        lectures[index];

      if (!lecture) {

        rows += `
          <div>
            <span class="muted">—</span>
          </div>
        `;

        return;
      }

      rows += `
        <div>
          <b>
            ${escapeHTML(lecture[0])}
          </b>

          <br>

          <span class="muted">
            ${escapeHTML(lecture[2] || "")}
          </span>
        </div>
      `;

    });

  });

  rows += "</div>";

  container.innerHTML =
    `<div class="week-table">${rows}</div>`;
}

/* ---------------------------------------------------------
   21. NOTES
   --------------------------------------------------------- */

function loadNotes() {

  const notes =
    $("#notes");

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
    $("#notes");

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

/* ---------------------------------------------------------
   22. VIEW SWITCHING
   --------------------------------------------------------- */

function setView(view) {

  activeView = view;

  const sections = {

    today: $("#todaySection"),

    week: $("#weekSection"),

    subjects: $("#subjectsSection"),

    attendance: $("#attendanceSection"),

    notes: $("#notesSection")

  };

  Object.entries(sections)
    .forEach(([name, section]) => {

      if (!section) {
        return;
      }

      section.classList.toggle(
        "hidden",
        name !== view
      );

    });

  $$(".nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.view === view
      );

    });

  if (view === "notes") {
    loadNotes();
  }
}

/* ---------------------------------------------------------
   23. FULL RENDER
   --------------------------------------------------------- */

function render() {

  renderHeader();

  renderTabs();

  renderToday();

  renderStats();

  renderSubjects();

  renderAttendance();

  renderWeek();
}

/* ---------------------------------------------------------
   24. REFRESH BUTTON
   --------------------------------------------------------- */

const refreshButton =
  $("#refreshBtn");

if (refreshButton) {

  refreshButton.addEventListener(
    "click",
    () => {

      render();

      showToast(
        "Timetable updated"
      );

    }
  );

}

/* ---------------------------------------------------------
   25. RESET ATTENDANCE
   --------------------------------------------------------- */

const resetAttendanceButton =
  $("#resetAttendance");

if (resetAttendanceButton) {

  resetAttendanceButton.addEventListener(
    "click",
    () => {

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

/* ---------------------------------------------------------
   26. SAVE NOTES BUTTON
   --------------------------------------------------------- */

const saveNotesButton =
  $("#saveNotes");

if (saveNotesButton) {

  saveNotesButton.addEventListener(
    "click",
    saveNotes
  );

}

/* ---------------------------------------------------------
   27. BOTTOM NAVIGATION
   --------------------------------------------------------- */

$$(".nav-item")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const view =
          button.dataset.view;

        if (!view) {
          return;
        }

        setView(view);
      }
    );

  });

/* ---------------------------------------------------------
   28. PWA INSTALL
   --------------------------------------------------------- */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredInstall = event;

    const installButton =
      $("#installBtn");

    if (installButton) {
      installButton.hidden = false;
    }

  }
);

const installButton =
  $("#installBtn");

if (installButton) {

  installButton.addEventListener(
    "click",
    async () => {

      if (!deferredInstall) {
        return;
      }

      deferredInstall.prompt();

      try {
        await deferredInstall.userChoice;
      } catch (error) {
        console.log(
          "Install prompt closed."
        );
      }

      deferredInstall = null;

      installButton.hidden = true;

    }
  );

}

/* ---------------------------------------------------------
   29. SERVICE WORKER
   --------------------------------------------------------- */

if ("serviceWorker" in navigator) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./sw.js")
        .then(registration => {

          console.log(
            "LLM Campus service worker registered:",
            registration.scope
          );

        })
        .catch(error => {

          console.error(
            "LLM Campus service worker registration failed:",
            error
          );

        });

    }
  );

}

/* ---------------------------------------------------------
   30. START APPLICATION
   --------------------------------------------------------- */

render();

setView("today");

/*
  Refresh live NOW/DONE/UPCOMING status
  every minute.
*/

window.setInterval(
  () => {
    renderHeader();
    renderToday();
    renderStats();
  },
  60000
);
```
