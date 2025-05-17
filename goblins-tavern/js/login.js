  const form = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = form.username.value.trim();
      const password = form.password.value;
      if ((username === "admin1" || username === "SuperAdmin") && password === "1234") {
        loginMessage.textContent = "Login successful!";
        loginMessage.style.color = "white";
        setTimeout(() => window.location.href = "manage.html", 1000);
      } else {
        loginMessage.textContent = "Wrong username or password";
        loginMessage.style.color = "red";
      }
    });
  }
