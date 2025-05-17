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

// Reset Button

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    searchForm.reset();
    resultsContainer.innerHTML = "";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const topRatedBtn = document.getElementById("topRatedBtn");
  const resultsContainer = document.getElementById("resultsContainer"); 

  if (topRatedBtn) {
    topRatedBtn.addEventListener("click", async () => {
      try {
        const res = await fetch("http://localhost:3000/api/top-rated");
        const text = await res.text(); 
        console.log("Réponse brute :", text);

        let results;
        try {
          results = JSON.parse(text);
        } catch (jsonErr) {
          throw new Error("Réponse invalide du serveur (non JSON)");
        }

        if (!res.ok) throw new Error(results.error || "Erreur lors du chargement des jeux");

        console.log("Jeux les mieux notés :", results);
        displayResults(results);
      } catch (err) {
        console.error("Erreur Top Rated:", err);
        if (resultsContainer) {
          resultsContainer.innerHTML = "<p style='color:white'>Erreur serveur.</p>";
        }
      }
    });
  } else {
    console.warn("⚠️ Le bouton #topRatedBtn n'existe pas dans le DOM.");
  }
});