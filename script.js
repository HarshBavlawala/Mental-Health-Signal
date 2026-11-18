const API_URL = "http://127.0.0.1:8000/predict";

const form = document.getElementById("predictionForm");
const resultBox = document.getElementById("resultBox");
const idleState = document.getElementById("idleState");
const signalState = document.getElementById("signalState");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    age: parseInt(document.getElementById("age").value, 10),
    gender: document.getElementById("gender").value,
    country: document.getElementById("country").value.trim(),
    academic_level: document.getElementById("academic_level").value,
    most_used_platform: document.getElementById("most_used_platform").value,
    purpose_of_use: document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours: parseFloat(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks: parseInt(document.getElementById("daily_unlocks").value, 10),
    study_hours: parseFloat(document.getElementById("study_hours").value),
    physical_activity_hours: parseFloat(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night: parseFloat(document.getElementById("sleep_hours_per_night").value),
    stress_level: document.getElementById("stress_level").value
  };

  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = "Computing Signal...";
  signalState.textContent = "Processing...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail ? JSON.stringify(data.detail) : "Inference failed");
    }

    const rawScore = Number(Object.values(data)[0]);
    const score = Math.min(10, Math.max(0, rawScore));

    let tierClass = "";
    let tierTitle = "";
    let tierSummary = "";

    if (score >= 7) {
      tierClass = "strong";
      tierTitle = "Strong Mental Health Signal";
      tierSummary = "Your current sleep consistency, study rhythm, and moderated screen exposure reflect strong psychological resilience.";
    } else if (score >= 4) {
      tierClass = "moderate";
      tierTitle = "Moderate Mental Health Signal";
      tierSummary = "Your daily rhythm shows a balanced baseline, though trimming passive screen unlocks or adding rest could elevate resilience.";
    } else {
      tierClass = "weak";
      tierTitle = "Weak Mental Health Signal";
      tierSummary = "Elevated strain detected across screen exposure and stress indicators. Prioritizing restorative sleep and digital boundaries is advised.";
    }

    // SVG Circle Circumference = 2 * PI * 70 ≈ 440
    const circumference = 440;
    const targetOffset = circumference - (score / 10) * circumference;

    idleState.classList.add("hidden");
    resultBox.className = `result-content ${tierClass}`;
    signalState.textContent = "Signal Computed";

    resultBox.innerHTML = `
      <div class="gauge-wrapper">
        <svg class="gauge-svg" viewBox="0 0 160 160">
          <circle class="gauge-bg" cx="80" cy="80" r="70"></circle>
          <circle class="gauge-progress" id="gaugeArc" cx="80" cy="80" r="70"></circle>
        </svg>
        <div class="gauge-center">
          <span id="animatedScore" class="big-score">0</span>
          <span class="score-denom">OUT OF 10</span>
        </div>
      </div>

      <div class="verdict-box">
        <div class="verdict-pill">${tierTitle}</div>
        <p class="verdict-summary">${tierSummary}</p>
      </div>
    `;

    // Trigger SVG Ring & Big Serif Counter Animation
    requestAnimationFrame(() => {
      document.getElementById("gaugeArc").style.strokeDashoffset = targetOffset;
      animateCounter("animatedScore", 0, score, 950);
    });

  } catch (err) {
    idleState.classList.add("hidden");
    signalState.textContent = "Connection Error";
    resultBox.className = "result-content";
    resultBox.innerHTML = `
      <div class="error-card">
        <strong>Inference Server Unreachable:</strong> ${err.message}<br><br>
        Ensure your FastAPI server is running on <code>127.0.0.1:8000</code> with CORS enabled.
      </div>
    `;
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "Run Wellness Inference";
  }
});

function animateCounter(elementId, start, end, duration) {
  const el = document.getElementById(elementId);
  const startTime = performance.now();
  const isDecimal = !Number.isInteger(end);

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentVal = start + (end - start) * eased;

    el.textContent = isDecimal ? currentVal.toFixed(1) : Math.round(currentVal);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.classList.add("pop");
      setTimeout(() => el.classList.remove("pop"), 320);
    }
  }

  requestAnimationFrame(update);
}