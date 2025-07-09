const MAX_IDLE = 20 * 60 * 1000; // 20 minutes

// --- Session check ---
const token = sessionStorage.getItem("auth_token");
if (!token) {
  window.location.replace("/");
}

// --- Inactivity timer ---
function updateActivity() {
  sessionStorage.setItem("last_activity", Date.now().toString());
}

function checkInactivity() {
  const last = parseInt(sessionStorage.getItem("last_activity") || "0", 10);
  if (Date.now() - last > MAX_IDLE) {
    sessionStorage.clear();
    alert("Session expired due to inactivity.");
    window.location.href = "/";
  }
}

document.addEventListener("mousemove", updateActivity);
document.addEventListener("keydown", updateActivity);
setInterval(checkInactivity, 60 * 1000); // check every minute