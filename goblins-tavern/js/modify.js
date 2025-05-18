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
      document.querySelector("[name='Designer']").value = (data.designers || []).join('; ');
      document.querySelector("[name='Wanting']").value = data.wanting || '';
      document.querySelector("[name='ArtworkUrl']").value = data.img || '';
      document.querySelector("[name='Publisher']").value = (data.publishers || []).join('; ');
      document.querySelector("[name='Category']").value = (data.categories || []).join('; ');
      document.querySelector("[name='MecaG']").value = (data.mechanics || []).join('; ');
      document.querySelector("[name='UserR']").value = data.user_rating || '';
      document.querySelector("[name='AvgR']").value = data.average_rating || '';

      document.getElementById("modifyForm").style.display = "block";

    } catch (error) {
      console.error("Error loading game:", error);
      alert(error.message);
    }
  });
}


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
