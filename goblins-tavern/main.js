document.addEventListener("DOMContentLoaded", () => {
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

  // admin login
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

  // game search
  const searchBtn = document.getElementById("searchBtn");
  const resultsContainer = document.getElementById("resultsContainer");
  const searchForm = document.getElementById("categoryForm");
  const resetBtn = document.getElementById("resetBtn");

  let sidePanel = document.createElement("div");
  sidePanel.id = "side-panel";
  sidePanel.style.position = "fixed";
  sidePanel.style.top = "0";
  sidePanel.style.right = "0";
  sidePanel.style.width = "400px";
  sidePanel.style.height = "100%";
  sidePanel.style.background = "#222";
  sidePanel.style.color = "white";
  sidePanel.style.padding = "20px";
  sidePanel.style.overflowY = "auto";
  sidePanel.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
  sidePanel.style.display = "none";
  sidePanel.style.zIndex = "1000";
  sidePanel.style.transition = "transform 0.3s ease, opacity 0.3s ease";
  sidePanel.style.transform = "translateX(100%)";
  sidePanel.style.opacity = "0";

  document.body.appendChild(sidePanel);

  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const year = document.getElementById("pref1").value;
      const minPlayers = document.getElementById("pref2").value;
      const playtime = document.getElementById("pref3").value;
      const maxPlayers = document.getElementById("pref4").value;

      const keywords = [];
      const kw1 = document.getElementById("keywords1");
      const kw3 = document.getElementById("keywords3");
      if (kw1 && kw1.value.trim() !== "") keywords.push(kw1.value.trim());
      if (kw3 && kw3.value.trim() !== "") keywords.push(kw3.value.trim());

      const searchData = { year, minPlayers, maxPlayers, playtime, keywords };

      try {
        const response = await fetch("http://localhost:3000/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(searchData)
        });

        const results = await response.json();

        if (response.ok && resultsContainer) {
          resultsContainer.innerHTML = "";

          if (results.length > 0) {
            results.forEach(game => {
              const card = document.createElement("div");
              card.classList.add("game-card");

              const imageUrl = game.img && game.img.startsWith("http")
                ? game.img
                : "../img/placeholder.jpg";

              card.innerHTML = `
                <img src="${imageUrl}" alt="${game.name}" class="game-image">
                <div class="game-info">
                  <h3>${game.name}</h3>
                  <p><strong>Published:</strong> ${game.yearpublished || "?"}</p>
                  <p><strong>Players:</strong> ${game.minplayers} – ${game.maxplayers}</p>
                  <p><strong>Time:</strong> ${game.playingtime} min</p>
                </div>
              `;

              card.addEventListener("click", async () => {
                console.log(game);

                try {
                  const response_detail = await fetch("http://localhost:3000/api/game-details", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id_bg: game.id_bg })
                  });
              
                  const details = await response_detail.json();
              
                  if (!response_detail.ok) {  // UPDATED: correct check here (response_detail, not response)
                    throw new Error(details.error || "Failed to fetch game details");
                  }

                  sidePanel.innerHTML = `
                    <button id="closePanel" style="position:absolute;top:10px;right:10px;background:#444;color:white;border:none;border-radius:50%;width:35px;height:35px;font-size:18px;cursor:pointer;">✕</button>
                    <h2 style="margin-top:50px;">${game.name}</h2>
                    <img src="${imageUrl}" alt="${game.name}" style="width: 100%; margin-bottom: 10px;">
                    <p><strong>Description:</strong> ${game.description || "No description available."}</p>
                    <p><strong>Board Game ID:</strong> ${game.id_bg}</p>
                    <p><strong>Players:</strong> ${game.minplayers} – ${game.maxplayers}</p>
                    <p><strong>Minimum Age:</strong> ${game.minage || "?"} years</p>
                    <p><strong>Publisher:</strong> ${details.publisher_name || "Unknown"}</p>
                    <p><strong>Designer:</strong> ${details.designer_name || "Unknown"}</p>
                    <p><strong>Owned:</strong> ${game.owned || 0}</p>
                    <p><strong>Wanted:</strong> ${game.wanting || 0}</p>
                    <p><strong>Mechanic:</strong> ${details.mechanic_name || "Unknown"}</p>
                    <p><strong>Category:</strong> ${details.bg_category_name || "Unknown"}</p>
                    <p><strong>Average Rating:</strong> ${game.average || "?"}</p>
                    <p><strong>Number of Users that Rated:</strong> ${game.users_rated || "?"}</p>
                    <p><strong>Game Expansion:</strong> ${details.expansion_name || "?"}</p><br>
                  `;

                  sidePanel.style.display = "block";
                  setTimeout(() => {
                    sidePanel.style.transform = "translateX(0)";
                    sidePanel.style.opacity = "1";
                  }, 10);

                  document.getElementById("closePanel").addEventListener("click", () => {
                    sidePanel.style.transform = "translateX(100%)";
                    sidePanel.style.opacity = "0";
                    setTimeout(() => {
                      sidePanel.style.display = "none";
                    }, 300);
                  });

                } catch (error) {
                  console.error("Error loading game details:", error);
                  alert("Failed to load detailed game info. Please try again.");
                }
              });

              resultsContainer.appendChild(card);
            });
          } else {
            resultsContainer.innerHTML = "<p style='color:white'>No results found.</p>";
          }
        } else {
          resultsContainer.innerHTML = `<p>Error: ${results.error}</p>`;
        }
      } catch (error) {
        console.error("Search error:", error);
        if (resultsContainer) {
          resultsContainer.innerHTML = "<p>Server error. Please try again later.</p>";
        }
      }
    });
  }

// Reset Button
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (searchForm) searchForm.reset();
    if (resultsContainer) resultsContainer.innerHTML = "";
  });
}

// Add Button
const addBtn = document.getElementById("addBtn");

if (addBtn) {
  addBtn.addEventListener("click", async () => {
    const fields = [
      "bg_id", "title", "description", "release_date", "min_p",
      "max_p", "time_p", "minage", "owned", "designer", "wanting",
      "artwork_url", "publisher", "category", "meca_g",
      "user_rating", "average_rating", "game_extention_id", "extansion_name"
    ];
    const data = {};
    let firstInvalid = null;

    fields.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.style.border = "";
        data[id] = input.value;
      }
    });

    ["bg_id", "title", "description", "release_date", "min_p", "max_p", "time_p", "minage"].forEach(id => {
      const input = document.getElementById(id);
      if (input && !input.value.trim()) {
        input.style.border = "2px solid red";
        if (!firstInvalid) firstInvalid = input;
      }
    });

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      alert("Please fill in all mandatory fields highlighted in red.");
      return;
    }

    const addData = {
      bg_id: parseInt(data.bg_id),
      title: data.title,
      description: data.description,
      release_date: parseInt(data.release_date) || 0,
      min_p: parseInt(data.min_p) || 0,
      max_p: parseInt(data.max_p) || 0,
      time_p: parseInt(data.time_p) || 0,
      minage: parseInt(data.minage) || 0,
      owned: parseInt(data.owned) || 0,
      designer: data.designer ? data.designer.split(";").map(s => s.trim()) : [],
      wanting: parseInt(data.wanting) || 0,
      artwork_url: data.artwork_url || '',
      publisher: data.publisher ? data.publisher.split(";").map(s => s.trim()) : [],
      category: data.category ? data.category.split(";").map(s => s.trim()) : [],
      meca_g: data.meca_g ? data.meca_g.split(";").map(s => s.trim()) : [],
      user_rating: parseInt(data.user_rating) || 0,
      average_rating: parseFloat(data.average_rating) || 0,
      game_extention_id: parseInt(data.game_extention_id),
      extansion_name: data.extansion_name
    };

    try {
      const response = await fetch("http://localhost:3000/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add the board game.");
      }

      alert("Board game added successfully!");
    } catch (error) {
      console.error("Add error:", error);
      alert(error.message || "An unexpected error occurred.");
    }
  });
}

// Delete Button
const deleteButton = document.getElementById("deleteBtn");

if (deleteButton) {
  deleteButton.addEventListener("click", deleteBoardGame);
}

async function deleteBoardGame() {
  const deleteIDInput = document.querySelector("input[name='DeleteID']");
  const deleteID = deleteIDInput.value.trim();

  if (!deleteID) {
    alert("Please enter a Board Game ID to delete.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/deletebg/${deleteID}`, {
      method: 'GET'
    });

    const game = await response.json();

    if (!response.ok) {
      alert(`Game not found: ${game.error}`);
      return;
    }

    showConfirmation(`Are you sure you want to delete the board game ${game.name} with ID "${deleteID}"?`, async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/boardgames/${deleteID}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
          alert("Board Game deleted successfully!");
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("An error occurred while deleting the board game.");
      }
    });
  } catch (error) {
    console.error("Fetch error:", error);
    alert("An error occurred while trying to find the board game.");
  }
}

function showConfirmation(message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');

  confirmMessage.textContent = message;
  modal.classList.remove('hidden');

  const cleanup = () => {
    modal.classList.add('hidden');
    confirmYes.removeEventListener('click', onConfirmClick);
    confirmNo.removeEventListener('click', onCancelClick);
  };

  const onConfirmClick = () => {
    try {
      onConfirm();
    } finally {
      cleanup();
    }
  };

  const onCancelClick = () => {
    cleanup();
  };

  confirmYes.addEventListener('click', onConfirmClick);
  confirmNo.addEventListener('click', onCancelClick);
}

// Search Modify Button
const modifsearchBtn = document.getElementById("modifsearchBtn");

if (modifsearchBtn) {
  modifsearchBtn.addEventListener("click", async () => {
    const searchId = document.getElementById("searchId").value.trim();
    if (!searchId) {
      alert("Please enter a game ID to search.");
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/game-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_bg: searchId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error fetching game details");

      console.log(data);
      document.querySelector("[name='BD_ID']").value = searchId;
      document.querySelector("[name='Title']").value = data.name || '';
      document.querySelector("[name='Description']").value = data.description || '';
      document.querySelector("[name='ReleaseDate']").value = data.yearpublished || '';
      document.querySelector("[name='MinP']").value = data.minplayers || '';
      document.querySelector("[name='MaxP']").value = data.maxplayers || '';
      document.querySelector("[name='TimeP']").value = data.playingtime || '';
      document.querySelector("[name='Minage']").value = data.minage || '';
      document.querySelector("[name='Owned']").value = data.owned || '';
      document.querySelector("[name='Designer']").value = data.designer_name || '';
      document.querySelector("[name='Wanting']").value = data.wanting || '';
      document.querySelector("[name='ArtworkUrl']").value = data.img || '';
      document.querySelector("[name='Publisher']").value = data.publisher_name || '';
      document.querySelector("[name='Category']").value = data.bg_category_name || '';
      document.querySelector("[name='MecaG']").value = data.mechanic_name || '';
      document.querySelector("[name='UserR']").value = data.user_rating || '';
      document.querySelector("[name='AvgR']").value = data.average_rating || '';
      document.querySelector("[name='Ex_IDG']").value = data.bgext_id || '';
      document.querySelector("[name='ExName']").value = data.expansion_name || '';

      document.getElementById("modifyForm").style.display = "block";

    } catch (error) {
      console.error("Error loading game:", error);
      alert(error.message);
    }
  });
}

// Update Button
const updateBtn = document.getElementById("updateBtn");
if (updateBtn) {
  updateBtn.addEventListener("click", async () => {
    const formData = {
      id_bg: document.querySelector("[name='BD_ID']").value,
      title: document.querySelector("[name='Title']").value,
      description: document.querySelector("[name='Description']").value,
      release_date: document.querySelector("[name='ReleaseDate']").value,
      min_p: document.querySelector("[name='MinP']").value,
      max_p: document.querySelector("[name='MaxP']").value,
      time_p: document.querySelector("[name='TimeP']").value,
      minage: document.querySelector("[name='Minage']").value,
      owned: document.querySelector("[name='Owned']").value,
      designer: document.querySelector("[name='Designer']").value,
      wanting: document.querySelector("[name='Wanting']").value,
      artwork_url: document.querySelector("[name='ArtworkUrl']").value,
      publisher: document.querySelector("[name='Publisher']").value,
      category: document.querySelector("[name='Category']").value,
      meca_g: document.querySelector("[name='MecaG']").value,
      user_rating: document.querySelector("[name='UserR']").value,
      average_rating: document.querySelector("[name='AvgR']").value,
      game_extention_id: document.querySelector("[name='Ex_IDG']").value,
      extansion_name: document.querySelector("[name='ExName']").value
    };

    try {
      const response = await fetch('http://localhost:3000/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error updating game");

      alert("Game updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Update error:", error);
      alert(error.message);
    }
    });
  }
});
