"use strict";

console.log("LLM Campus app.js loaded successfully");

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded successfully");

  var heading = document.getElementById("greeting");

  if (heading) {
    heading.textContent = "LLM Campus is working";
  }
});
