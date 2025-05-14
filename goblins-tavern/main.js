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

  // Admin login
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

// Game Search
const searchBtn = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("resultsContainer");
const searchForm = document.getElementById("categoryForm");
const resetBtn = document.getElementById("resetBtn");

let sidePanel = document.createElement("div");
sidePanel.id = "side-panel";
Object.assign(sidePanel.style, {
  position: "fixed",
  top: "0",
  right: "0",
  width: "400px",
  height: "100%",
  background: "#222",
  color: "white",
  padding: "20px",
  overflowY: "auto",
  boxShadow: "0 0 10px rgba(0,0,0,0.5)",
  display: "none",
  zIndex: "1000",
  transition: "transform 0.3s ease, opacity 0.3s ease",
  transform: "translateX(100%)",
  opacity: "0"
});
document.body.appendChild(sidePanel);

if (searchBtn) {
  searchBtn.addEventListener("click", async () => {
    const year = document.getElementById("pref1").value;
    const minPlayers = document.getElementById("pref2").value;
    const playtime = document.getElementById("pref3").value;
    const maxPlayers = document.getElementById("pref4").value;

    const name = document.getElementById("keywords1").value.trim();
    const mechanic = document.getElementById("keywords3").value.trim();
    const category = document.getElementById("keywords4").value.trim();
    const designer = document.getElementById("keywords5").value.trim();

    // 🔍 Si seulement designer est rempli (recherche spéciale)
    if (designer && !year && !minPlayers && !playtime && !maxPlayers && !name && !mechanic && !category) {
      try {
        const res = await fetch("http://localhost:3000/api/search/designer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ designer })
        });

        const results = await res.json();
        if (!res.ok) throw new Error(results.error || "Recherche échouée");

        displayResults(results);
      } catch (err) {
        console.error("Erreur recherche designer:", err);
        resultsContainer.innerHTML = "<p style='color:white'>Erreur serveur. Réessaie plus tard.</p>";
      }
      return;
    }

    // 🔍 Recherche générale
    const searchData = {
      year,
      minPlayers,
      playtime,
      maxPlayers,
      keywords: []
    };

    if (name) searchData.keywords.push(name);
    if (mechanic) searchData.keywords.push(mechanic);
    if (category) searchData.keywords.push(category);
    if (designer) searchData.keywords.push(designer);

    try {
      const res = await fetch("http://localhost:3000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchData)
      });

      const results = await res.json();
      if (!res.ok) throw new Error(results.error || "Search failed");

      displayResults(results);
    } catch (err) {
      console.error("Search error:", err);
      resultsContainer.innerHTML = "<p style='color:white'>Server error. Please try again later.</p>";
    }
  });
}

function displayResults(results) {
  resultsContainer.innerHTML = results.length > 0
    ? results.map(game => {
        const img = game.img?.startsWith("http") ? game.img : "../img/placeholder.jpg";
        return `
          <div class="game-card" data-id="${game.id_bg}">
            <img src="${img}" alt="${game.name}" class="game-image">
            <div class="game-info">
              <h3>${game.name}</h3>
              <p><strong>Published:</strong> ${game.yearpublished || "?"}</p>
              <p><strong>Players:</strong> ${game.minplayers} – ${game.maxplayers}</p>
              <p><strong>Time:</strong> ${game.playingtime} min</p>
            </div>
          </div>
        `;
      }).join("")
    : "<p style='color:white'>No results found.</p>";

  [...resultsContainer.querySelectorAll(".game-card")].forEach(card => {
    card.addEventListener("click", async () => {
      const gameId = card.getAttribute("data-id");
      const game = results.find(g => g.id_bg == gameId);
      try {
        const resDetails = await fetch(`http://localhost:3000/api/game/${gameId}`);
        if (!resDetails.ok) {
          const errorText = await resDetails.text();
          console.error("Error fetching game details:", errorText);
          alert("Failed to fetch game details: " + errorText);
          return;
        }

        const details = await resDetails.json();
        sidePanel.innerHTML = `
          <button id="closePanel" style="position:absolute;top:10px;right:10px;background:#444;color:white;border:none;border-radius:50%;width:35px;height:35px;font-size:18px;cursor:pointer;">✕</button>
          <h2 style="margin-top:50px;">${game.name}</h2>
          <img src="${game.img}" alt="${game.name}" style="width: 100%; margin-bottom: 10px;">
          <p><strong>Description:</strong> ${game.description || "No description available."}</p>
          <p><strong>Players:</strong> ${game.minplayers} – ${game.maxplayers}</p>
          <p><strong>Publisher(s):</strong> ${details.publishers.join(", ") || "Unknown"}</p>
          <p><strong>Designer(s):</strong> ${details.designers.join(", ") || "Unknown"}</p>
          <p><strong>Mechanic(s):</strong> ${details.mechanics.join(", ") || "Unknown"}</p>
          <p><strong>Category(ies):</strong> ${details.categories.join(", ") || "Unknown"}</p>
          <p><strong>Avg Rating:</strong> ${game.average || "?"}</p>
        `;

        sidePanel.style.display = "block";
        setTimeout(() => {
          sidePanel.style.transform = "translateX(0)";
          sidePanel.style.opacity = "1";
        }, 10);

        document.getElementById("closePanel").addEventListener("click", () => {
          sidePanel.style.transform = "translateX(100%)";
          sidePanel.style.opacity = "0";
          setTimeout(() => sidePanel.style.display = "none", 300);
        });

      } catch (err) {
        console.error("Game detail error:", err);
        alert(err.message || "Failed to fetch game details");
      }
    });
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    searchForm.reset();
    resultsContainer.innerHTML = "";
  });
}

// Top rate
document.getElementById("topRatedBtn").addEventListener("click", async () => {
  try {
   
    const res = await fetch("http://localhost:3000/api/top-rated");
    const results = await res.json();

    if (!res.ok) throw new Error(results.error || "Erreur lors du chargement des jeux");

   
    displayResults(results);
  } catch (err) {
    console.error("Erreur Top Rated:", err);
    resultsContainer.innerHTML = "<p style='color:white'>Erreur serveur.</p>";
  }
});



  // Reset Button
  resetBtn?.addEventListener("click", () => {
    searchForm?.reset();
    if (resultsContainer) resultsContainer.innerHTML = "";
  });

// Add Button
const addBtn = document.getElementById("addBtn");
if (addBtn) {
  addBtn.addEventListener("click", async () => {
    
    const fields = [
  "bg_id", "title", "description", "release_date", "min_p", "max_p", "time_p", "minage", "owned",
  "designer", "wanting", "artwork_url", "publisher", "category", "meca_g",
  "user_rating", "average_rating", "game_extention_id", "extansion_name"
];


    const data = {};
    let firstInvalid = null;

   
    for (const id of fields) {
      const input = document.getElementById(id);
      if (input) {
        console.log(`Collecting ${id}:`, input.value);  
        input.style.border = "";
        data[id] = input.value.trim();
      } else {
        console.log(`Field ${id} not found!`); 
      }
    }

 
    const requiredFields = [
  "bg_id", "title", "description", "release_date", "min_p", "max_p", "time_p", "minage",
  "owned", "designer", "wanting", "publisher", "category", "meca_g"
];

    requiredFields.forEach(id => {
      const input = document.getElementById(id);
      if (input && !input.value.trim()) {
        input.style.border = "2px solid red";
        if (!firstInvalid) firstInvalid = input;
      }
    });


    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth" });
      return alert("Please fill all required fields.");
    }

   
    console.log("Data to be sent:", data);

   
    const addData = {
      bg_id: +data.bg_id || 0, 
      title: data.title || "",  
      description: data.description || "",  
      release_date: data.release_date ? +data.release_date : null, 
      min_p: +data.min_p || 0, 
      max_p: +data.max_p || 0,  
      time_p: +data.time_p || 0,  
      minage: +data.minage || 0,  
      owned: +data.owned || 0,  
      designer: data.designer.split(";").map(s => s.trim()) || [], 
      wanting: +data.wanting || 0,  
      artwork_url: data.artwork_url || null,  
      publisher: data.publisher.split(";").map(s => s.trim()) || [],  
      category: data.category.split(";").map(s => s.trim()) || [],  
      meca_g: data.meca_g.split(";").map(s => s.trim()) || [], 
      user_rating: +data.user_rating || 0,  
      average_rating: +parseFloat(data.average_rating) || 0,  
      game_extention_id: +data.game_extention_id || null, 
      extansion_name: data.extansion_name || null  
    };

   
    console.log("Data to be sent after transformation:", addData);

 
    try {
      const res = await fetch("http://localhost:3000/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addData)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to add");

      alert("Board game added successfully!");
    } catch (err) {
      console.error("Add error:", err);
      alert(err.message);
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
    const updatedGame = {
      id_bg: document.querySelector("[name='BD_ID']").value.trim(),
      name: document.querySelector("[name='Title']").value.trim(),
      description: document.querySelector("[name='Description']").value.trim(),
      yearpublished: document.querySelector("[name='ReleaseDate']").value.trim(),
      min_p: parseInt(document.querySelector("[name='MinP']").value.trim()) || null,
      max_p: parseInt(document.querySelector("[name='MaxP']").value.trim()) || null,
      time_p: parseInt(document.querySelector("[name='TimeP']").value.trim()) || null,
      minage: parseInt(document.querySelector("[name='Minage']").value.trim()) || null,
      owned: parseInt(document.querySelector("[name='Owned']").value.trim()) || null,
      wanting: parseInt(document.querySelector("[name='Wanting']").value.trim()) || null,
      designer: document.querySelector("[name='Designer']").value.trim(),
      artwork_url: document.querySelector("[name='ArtworkUrl']").value.trim(),
      publisher: document.querySelector("[name='Publisher']").value.trim(),
      category: document.querySelector("[name='Category']").value.trim(),
      meca_g: document.querySelector("[name='MecaG']").value.trim(),
      user_rating: parseInt(document.querySelector("[name='UserR']").value.trim()) || null,
      average_rating: parseFloat(document.querySelector("[name='AvgR']").value.trim()) || null
    };

    try {
      const response = await fetch("http://localhost:3000/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedGame)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Update failed");
      }

      alert("Game updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Error: " + error.message);
    }
  });
}


});
