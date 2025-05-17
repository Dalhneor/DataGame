const addBtn = document.getElementById("addBtn");
const resetBtn = document.getElementById("resetBtn");
const searchForm = document.getElementById("manageForm"); 
const deleteButton = document.getElementById("deleteBtn");

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


if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    searchForm.reset();
    resultsContainer.innerHTML = "";
  });
}


if (deleteButton) {
  console.log("Delete button found, attaching event listener");
  deleteButton.addEventListener("click", deleteBoardGame);
} else {
  console.warn("Delete button NOT found!");
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