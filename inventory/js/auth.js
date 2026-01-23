function isLoggedIn() {
  return localStorage.getItem("loggedIn") === "true";
}

function openDashboard() {
  if (isLoggedIn()) {
    window.location.href = "dashboard.html";
  } else {
    window.location.href = "index.html";
  }
}

function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;

  if (u === "admin" && p === "1234") {
    localStorage.setItem("loggedIn", "true");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid Credentials");
  }
}

function protectDashboard() {
  if (!isLoggedIn()) {
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "index.html";
}
