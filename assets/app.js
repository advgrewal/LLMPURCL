/* =========================================================
   LLM CAMPUS - app.js
   Plain JavaScript. No external libraries.
   ========================================================= */

(function () {
  "use strict";

  var timetable = window.TIMETABLE;

  if (!timetable || !timetable.days || !timetable.slots) {
    console.error("LLM Campus: data.js did not load.");
    return;
  }

  var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  var selectedDay = getCollegeDay();
  var activeView = "today";
  var installPrompt = null;

  function el(id) {
    return document.getElementById(id);
  }

  function todayName() {
    var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return names[new Date().getDay()];
  }

  function getCollegeDay() {
    var today = todayName();
    return DAYS.indexOf(today) >= 0 ? today : "Monday";
  }

  function toMinutes(value) {
    var parts = String(value).split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function formatTime(value) {
    var parts = String(value).split(":");
    var hours = Number(parts[0]);
    var minutes = Number(parts[1]);
    var period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return hours + ":" + String(minutes).padStart(2, "0") + " " + period;
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function greeting() {
    var hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  function statusFor(day, index) {
    if (day !== todayName()) return "up";

    var slot = timetable.slots[index];
    if (!slot) return "up";

    var now = new Date();
    var current = now.getHours() * 60 + now.getMinutes();
    var start = toMinutes(slot.start);
    var end = toMinutes(slot.end);

    if (current >= start && current < end) return "now";
    if (current >= end) return "done";
    return "up";
  }

  function showToast(message) {
    var toast = el("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(function () {
      toast.classList.remove("show");
    }, 1800);
  }

  function renderHeader() {
    var date = el("todayDate");
    var greetingEl = el("greeting");
    var next = el("nextCard");

    if (date) {
      date.textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }

    if (greetingEl) greetingEl.textContent = greeting();
    if (!next) return;

    var lectures = timetable.days[selectedDay] || [];
    var index = -1;
    var label = "SELECTED DAY";

    if (selectedDay === todayName()) {
      for (var i = 0; i < lectures.length; i++) {
        if (statusFor(selectedDay, i) === "now") {
          index = i;
          label = "NOW";
          break;
        }
      }

      if (index === -1) {
        for (var j = 0; j < lectures.length; j++) {
          if (statusFor(selectedDay, j) === "up") {
            index = j;
            label = "NEXT";
            break;
          }
        }
      }
    } else if (lectures.length) {
      index = 0;
    }

    if (index === -1) {
      next.innerHTML = '<div class="label">TODAY</div><h3>Classes finished</h3><p>No more lectures scheduled.</p>';
      return;
    }

    var lecture = lectures[index];
    var slot = timetable.slots[index];

    next.innerHTML =
      '<div class="label">' + label + "</div>" +
      "<h3>" + escapeHTML(lecture[0]) + "</h3>" +
      "<p>" + formatTime(slot.start) + " – " + formatTime(slot.end) + "</p>" +
      "<p>" + escapeHTML(lecture[1]) +
      (lecture[2] ? " • " + escapeHTML(lecture[2]) : "") +
      "</p>";
  }

  function renderDayTabs() {
    var container = el("dayTabs");
    if (!container) return;

    var html = "";

    DAYS.forEach(function (day) {
      html +=
        '<button type="button" data-day="' + escapeHTML(day) +
        '" class="' + (day === selectedDay ? "active" : "") + '">' +
        escapeHTML(day.substring(0, 3)) +
        "</button>";
    });

    container.innerHTML = html;

    container.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        selectedDay = button.getAttribute("data-day");
        setView("today");
        render();
      });
    });
  }

  function renderSchedule() {
    var schedule = el("schedule");
    var title = el("scheduleTitle");
    if (!schedule) return;

    if (title) title.textContent = selectedDay + " lectures";

    var lectures = timetable.days[selectedDay] || [];

    if (!lectures.length) {
      schedule.innerHTML = '<div class="card"><p class="muted">No lectures scheduled.</p></div>';
      return;
    }

    var html = "";

    lectures.forEach(function (lecture, index) {
      var slot = timetable.slots[index];
      if (!slot) return;

      var status = statusFor(selectedDay, index);
      var badge = status === "now" ? "NOW" : status === "done" ? "DONE" : "UPCOMING";

      html +=
        '<article class="lecture ' + status + '">' +
        '<div class="time">' + formatTime(slot.start) +
        "<small>to " + formatTime(slot.end) + "</small></div>" +
        "<div>" +
        '<div class="subject-name">' + escapeHTML(lecture[0]) + "</div>" +
        '<div class="faculty">' + escapeHTML(lecture[1]) + "</div>" +
        (lecture[2] ? '<span class="room">' + escapeHTML(lecture[2]) + "</span>" : "") +
        "</div>" +
        '<span class="badge ' + status + '">' + badge + "</span>" +
        "</article>";
    });

    schedule.innerHTML = html;
  }

  function subjectsList() {
    var result = [];

    DAYS.forEach(function (day) {
      (timetable.days[day] || []).forEach(function (lecture) {
        if (result.indexOf(lecture[0]) === -1) result.push(lecture[0]);
      });
    });

    return result;
  }

  function readObject(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (error) {
      return {};
    }
  }

  function renderStats() {
    var stats = el("stats");
    if (!stats) return;

    var lectures = timetable.days[selectedDay] || [];
    var terms = lectures.filter(function (x) {
      return x[0] === "Term Paper";
    }).length;

    var presentObj = readObject("llm_attendance");
    var totalObj = readObject("llm_attendance_total");
    var present = 0;
    var total = 0;

    Object.keys(presentObj).forEach(function (key) {
      present += Number(presentObj[key]) || 0;
    });

    Object.keys(totalObj).forEach(function (key) {
      total += Number(totalObj[key]) || 0;
    });

    var percentage = total ? Math.round((present / total) * 100) : 0;

    stats.innerHTML =
      '<div class="stat"><strong>' + lectures.length + '</strong><span>lecture slots</span></div>' +
      '<div class="stat"><strong>' + terms + '</strong><span>term paper slots</span></div>' +
      '<div class="stat"><strong>' + percentage + '%</strong><span>attendance tracked</span></div>';
  }

  function renderSubjects() {
    var container = el("subjects");
    if (!container) return;

    var attendance = readObject("llm_attendance");
    var totals = readObject("llm_attendance_total");
    var html = "";

    subjectsList().forEach(function (subject) {
      var present = Number(attendance[subject]) || 0;
      var total = Number(totals[subject]) || 0;
      var percentage = total ? Math.round((present / total) * 100) : 0;

      var weeklyDays = 0;
      DAYS.forEach(function (day) {
        var found = (timetable.days[day] || []).some(function (lecture) {
          return lecture[0] === subject;
        });
        if (found) weeklyDays++;
      });

      html +=
        '<div class="card">' +
        "<h3>" + escapeHTML(subject) + "</h3>" +
        "<p>" + weeklyDays + " day" + (weeklyDays === 1 ? "" : "s") + " per week</p>" +
        '<div class="progress"><i style="width:' + Math.min(100, percentage) + '%"></i></div>' +
        "<p><b>" + percentage + "%</b> attendance • " + present + "/" + total + " marked</p>" +
        "</div>";
    });

    container.innerHTML = html;
  }

  function renderAttendance() {
    var container = el("attendance");
    if (!container) return;

    var attendance = readObject("llm_attendance");
    var totals = readObject("llm_attendance_total");
    var html = "";

    subjectsList().forEach(function (subject) {
      var present = Number(attendance[subject]) || 0;
      var total = Number(totals[subject]) || 0;
      var percentage = total ? Math.round((present / total) * 100) : 0;

      html +=
        '<div class="card">' +
        '<div class="att-row">' +
        "<div>" +
        "<h3>" + escapeHTML(subject) + "</h3>" +
        '<div class="progress"><i style="width:' + Math.min(100, percentage) + '%"></i></div>' +
        "<p>" + present + "/" + total + " present • " + percentage + "%</p>" +
        "</div>" +
        '<div class="att-actions">' +
        '<button type="button" data-subject="' + escapeHTML(subject) + '" data-present="1">Present</button>' +
        '<button type="button" data-subject="' + escapeHTML(subject) + '" data-present="0">Absent</button>' +
        "</div>" +
        "</div>" +
        "</div>";
    });

    container.innerHTML = html;

    container.querySelectorAll("button[data-subject]").forEach(function (button) {
      button.addEventListener("click", function () {
        markAttendance(
          button.getAttribute("data-subject"),
          button.getAttribute("data-present") === "1"
        );
      });
    });
  }

  function markAttendance(subject, present) {
    var attendance = readObject("llm_attendance");
    var totals = readObject("llm_attendance_total");

    attendance[subject] = Number(attendance[subject]) || 0;
    totals[subject] = Number(totals[subject]) || 0;

    totals[subject] += 1;
    if (present) attendance[subject] += 1;

    localStorage.setItem("llm_attendance", JSON.stringify(attendance));
    localStorage.setItem("llm_attendance_total", JSON.stringify(totals));

    render();
    showToast(present ? "Present marked" : "Absent marked");
  }

  function renderWeek() {
    var container = el("week");
    if (!container) return;

    var html = '<div class="week-table"><div class="week-grid">';
    html += '<div class="week-head">Day</div>';

    timetable.slots.forEach(function (slot) {
      html += '<div class="week-head">' + formatTime(slot.start) + "</div>";
    });

    DAYS.forEach(function (day) {
      html += '<div class="week-day">' + escapeHTML(day) + "</div>";

      var lectures = timetable.days[day] || [];

      timetable.slots.forEach(function (_, index) {
        var lecture = lectures[index];

        if (!lecture) {
          html += '<div><span class="muted">—</span></div>';
        } else {
          html +=
            "<div><b>" + escapeHTML(lecture[0]) + "</b><br>" +
            '<span class="muted">' + escapeHTML(lecture[2] || "") + "</span></div>";
        }
      });
    });

    html += "</div></div>";
    container.innerHTML = html;
  }

  function loadNotes() {
    var notes = el("notes");
    if (notes) notes.value = localStorage.getItem("llm_notes") || "";
  }

  function saveNotes() {
    var notes = el("notes");
    if (!notes) return;

    localStorage.setItem("llm_notes", notes.value);
    showToast("Notes saved");
  }

  function setView(view) {
    activeView = view;

    var sections = {
      today: el("todaySection"),
      week: el("weekSection"),
      subjects: el("subjectsSection"),
      attendance: el("attendanceSection"),
      notes: el("notesSection")
    };

    Object.keys(sections).forEach(function (name) {
      var section = sections[name];
      if (!section) return;

      if (name === view) section.classList.remove("hidden");
      else section.classList.add("hidden");
    });

    document.querySelectorAll(".nav-item").forEach(function (button) {
      button.classList.toggle(
        "active",
        button.getAttribute("data-view") === view
      );
    });

    if (view === "notes") loadNotes();
  }

  function render() {
    renderHeader();
    renderDayTabs();
    renderSchedule();
    renderStats();
    renderSubjects();
    renderAttendance();
    renderWeek();
  }

  /* ---------- Buttons ---------- */

  var refresh = el("refreshBtn");
  if (refresh) {
    refresh.addEventListener("click", function () {
      selectedDay = getCollegeDay();
      render();
      showToast("Updated");
    });
  }

  var reset = el("resetAttendance");
  if (reset) {
    reset.addEventListener("click", function () {
      if (!window.confirm("Reset all attendance records?")) return;

      localStorage.removeItem("llm_attendance");
      localStorage.removeItem("llm_attendance_total");

      render();
      showToast("Attendance reset");
    });
  }

  var save = el("saveNotes");
  if (save) save.addEventListener("click", saveNotes);

  document.querySelectorAll(".nav-item").forEach(function (button) {
    button.addEventListener("click", function () {
      setView(button.getAttribute("data-view"));
    });
  });

  /* ---------- PWA installation ---------- */

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    installPrompt = event;

    var installButton = el("installBtn");
    if (installButton) installButton.hidden = false;
  });

  var installButton = el("installBtn");

  if (installButton) {
    installButton.addEventListener("click", async function () {
      if (!installPrompt) {
        showToast("Install option is not available yet");
        return;
      }

      installPrompt.prompt();

      try {
        await installPrompt.userChoice;
      } catch (error) {
        console.log("Install prompt closed.");
      }

      installPrompt = null;
      installButton.hidden = true;
    });
  }

  /* ---------- Service worker ---------- */

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js")
        .then(function (registration) {
          console.log(
            "LLM Campus service worker registered:",
            registration.scope
          );
        })
        .catch(function (error) {
          console.error(
            "LLM Campus service worker registration failed:",
            error
          );
        });
    });
  }

  /* ---------- Start ---------- */

  render();
  setView("today");

  window.setInterval(function () {
    renderHeader();
    renderSchedule();
    renderStats();
  }, 60000);

})();
