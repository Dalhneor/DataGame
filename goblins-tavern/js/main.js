document.addEventListener("DOMContentLoaded", () => {
  // Navigation Buttons
  const homeBtn = document.getElementById("homeButton");
  const recoBtn = document.getElementById("recoButton");
  const loginBtn = document.getElementById("loginButton");
  const discoverBtn = document.getElementById("discoverButton");
  const gameSection = document.getElementById("gameSection");
  const logoutBtn = document.getElementById("logoutButton");
  const manageBtn = document.getElementById("manageButton");
  const modifyBtn = document.getElementById("modifButton");
  const superGame = document.getElementById("super-games");

  if (homeBtn) homeBtn.addEventListener("click", () => window.location.href = "home.html");
  if (recoBtn) recoBtn.addEventListener("click", () => window.location.href = "recommandations.html");
  if (loginBtn) loginBtn.addEventListener("click", () => window.location.href = "login.html");
  if (logoutBtn) logoutBtn.addEventListener("click", () => window.location.href = "home.html");
  if (manageBtn) manageBtn.addEventListener("click", () => window.location.href = "manage.html");
  if (modifyBtn) modifyBtn.addEventListener("click", () => window.location.href = "modify.html");
  if (superGame) superGame.addEventListener("click", () => window.location.href = "recommandations.html");
  if (discoverBtn && gameSection) {
    discoverBtn.addEventListener("click", () => gameSection.scrollIntoView({ behavior: "smooth" }));
  }

});
