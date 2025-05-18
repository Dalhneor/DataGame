const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');

const PORT = 3000;

(async () => {
  const db = await mysql.createPool({
    host: "localhost",
    user: "root",
    password: "azerty12",
    database: "boardgameDB",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const app = express();
  app.use(cors());
  app.use(express.static('HTML'));
  app.use(express.json());

  const [sqlModeResult] = await db.query('SELECT @@sql_mode');
  console.log('Current SQL Mode:', sqlModeResult[0]['@@sql_mode']);

  if (sqlModeResult[0]['@@sql_mode'].includes('ONLY_FULL_GROUP_BY')) {
    await db.query("SET SESSION sql_mode = REPLACE(@@sql_mode, 'ONLY_FULL_GROUP_BY', '')");
    console.log('Modified SQL Mode to remove ONLY_FULL_GROUP_BY');
  }

  // Routes
  app.get('/api/boardgames', async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT * FROM Board_Game LIMIT 100`);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/game-details', async (req, res) => {
    const { id_bg } = req.body;
    if (!id_bg) return res.status(400).json({ error: "id_bg is required" });

    const query = `
      SELECT 
        bg.*,
        d.name AS designer_name,
        p.name AS publisher_name,
        m.name AS mechanic_name,
        bgc.name AS bg_category_name,
        bge.id_bge AS bgext_id,
        bge.name AS expansion_name
      FROM Board_Game bg
      LEFT JOIN Designed_By db ON bg.id_bg = db.id_bg
      LEFT JOIN BG_Designer d ON db.designer_name = d.name
      LEFT JOIN Published_By pb ON bg.id_bg = pb.id_bg
      LEFT JOIN BG_Publisher p ON pb.publisher_name = p.name
      LEFT JOIN Uses_Mechanic um ON bg.id_bg = um.id_bg
      LEFT JOIN BG_Mechanic m ON um.mechanic_name = m.name
      LEFT JOIN Is_Of_Category cat ON bg.id_bg = cat.id_bg
      LEFT JOIN BG_Category bgc ON cat.category_name = bgc.name
      LEFT JOIN BG_Expansion bge ON bg.id_bg = bge.id_bg
      WHERE bg.id_bg = ?
      GROUP BY bg.id_bg
    `;

    try {
      const [rows] = await db.query(query, [id_bg]);
      if (rows.length === 0) return res.status(404).json({ error: "Board game not found" });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/search', async (req, res) => {
    const { year, minPlayers, maxPlayers, playtime, keywords } = req.body;
    let query = `SELECT * FROM Board_Game WHERE 1=1`;
    const params = [];

    if (year) {
      if (year === "one") query += ` AND yearpublished < 2000`;
      if (year === "two") query += ` AND yearpublished BETWEEN 2000 AND 2010`;
      if (year === "three") query += ` AND yearpublished BETWEEN 2010 AND 2020`;
      if (year === "four") query += ` AND yearpublished >= 2020`;
    }

    if (minPlayers) {
      if (minPlayers === "one") query += ` AND minplayers = 1`;
      if (minPlayers === "two") query += ` AND minplayers <= 2`;
      if (minPlayers === "three") query += ` AND minplayers <= 4`;
      if (minPlayers === "four") query += ` AND minplayers <= 6`;
    }

    if (maxPlayers) {
      if (maxPlayers === "one") query += ` AND maxplayers <= 2`;
      if (maxPlayers === "two") query += ` AND maxplayers <= 4`;
      if (maxPlayers === "three") query += ` AND maxplayers <= 6`;
      if (maxPlayers === "four") query += ` AND maxplayers <= 8`;
      if (maxPlayers === "five") query += ` AND maxplayers <= 12`;
    }

    if (playtime) {
      if (playtime === "one") query += ` AND playingtime <= 20`;
      if (playtime === "two") query += ` AND playingtime <= 60`;
      if (playtime === "three") query += ` AND playingtime > 60`;
      if (playtime === "four") query += ` AND playingtime > 120`;
      if (playtime === "five") query += ` AND playingtime > 180`;
    }

    if (keywords && keywords.length > 0) {
  keywords.forEach(keyword => {
    query += ` AND (name LIKE ? OR description LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  });
}


    try {
      const [rows] = await db.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/game/:id', async (req, res) => {
  const gameId = parseInt(req.params.id, 10);

  if (isNaN(gameId)) {
    return res.status(400).json({ error: 'Invalid game ID' });
  }

  try {
    const [results] = await db.query(`CALL GetBoardGameDetails(?)`, [gameId]);

    // results = [
    //   [0] -> Board_Game,
    //   [1] -> Categories,
    //   [2] -> Mechanics,
    //   [3] -> Designers,
    //   [4] -> Publishers
    // ]

    const gameDetails = {
      info: results[0][0] || null, // Unique game
      categories: results[1].map(row => row.category_name),
      mechanics: results[2].map(row => row.mechanic_name),
      designers: results[3].map(row => row.designer_name),
      publishers: results[4].map(row => row.publisher_name)
    };

    res.json(gameDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/search/category', async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  try {
    const [results] = await db.query(`CALL GetGamesByCategory(?)`, [category]);

    
    res.json(results[0]); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rate', async (req, res) => {
  const { id_bg, rating } = req.body;

  if (!id_bg || rating < 2 || rating > 10) {
    return res.status(400).json({ error: "Invalid input." });
  }

  try {
    const [rows] = await db.query('SELECT users_rated, average FROM Board_Game WHERE id_bg = ?', [id_bg]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Board game not found." });
    }

    const current = rows[0];
    const newUsersRated = current.users_rated + 1;
    const newAverage = ((current.average * current.users_rated) + rating) / newUsersRated;

    await db.query('UPDATE Board_Game SET users_rated = ?, average = ? WHERE id_bg = ?', [
      newUsersRated, parseFloat(newAverage.toFixed(2)), id_bg
    ]);
    res.json({ message: "Rating updated successfully.", newUsersRated , newAverage: newAverage.toFixed(2) });
  } catch (err) {
    console.error("Erreur mise à jour rating:", err);
    res.status(500).json({ error: "Server error." });
  }
});

app.post('/api/search/designer', async (req, res) => {
  const { designer } = req.body;

  try {
    const [results] = await db.query(`CALL GetGamesByDesigner(?)`, [designer]); 

    res.json(results[0]); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/top-rated', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Top_Rated_Games');
    res.status(200).json(rows);
  } catch (err) {
    console.error("Erreur lors de la récupération des jeux les mieux notés :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

  app.get('/api/deletebg/:id', async (req, res) => {
    const gameId = req.params.id;
    try {
      const [rows] = await db.query(`SELECT id_bg, name FROM Board_Game WHERE id_bg = ?`, [gameId]);
      if (rows.length === 0) return res.status(404).json({ error: "Board Game not found." });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/boardgames/:id', async (req, res) => {
    const gameId = req.params.id;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const deletions = [
        `DELETE FROM Designed_By WHERE id_bg = ?`,
        `DELETE FROM Published_By WHERE id_bg = ?`,
        `DELETE FROM Is_Of_Category WHERE id_bg = ?`,
        `DELETE FROM Uses_Mechanic WHERE id_bg = ?`,
        `DELETE FROM BG_Expansion WHERE id_bg = ?`,
        `DELETE FROM Board_Game WHERE id_bg = ?`
      ];
      for (const query of deletions) {
        await conn.query(query, [gameId]);
      }
      await conn.commit();
      res.status(200).json({ message: "Board Game and all related data deleted successfully!" });
    } catch (err) {
      await conn.rollback();
      res.status(500).json({ error: "Error deleting data: " + err.message });
    } finally {
      conn.release();
    }
  });

app.post('/api/update', async (req, res) => {
  const {
    id_bg, name, description, yearpublished, min_p, max_p, time_p,
    minage, owned, designer, wanting, artwork_url, publisher, category,
    meca_g, user_rating, average_rating
  } = req.body;

  if (!id_bg || !name || !description || !yearpublished) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const updateBoardGameQuery = `
      UPDATE Board_Game
      SET 
        name = ?, description = ?, yearpublished = ?, minplayers = ?, maxplayers = ?, 
        playingtime = ?, minage = ?, owned = ?, wanting = ?, 
        img = ?, users_rated = ?, average = ?
      WHERE id_bg = ?
    `;
    const boardGameParams = [
      name, description, yearpublished, min_p, max_p, time_p,
      minage, owned, wanting, artwork_url, user_rating, average_rating, id_bg
    ];
    await db.query(updateBoardGameQuery, boardGameParams);
    await db.query(`DELETE FROM Designed_By WHERE id_bg = ?`, [id_bg]);
    if (designer && designer.trim()) {
      await db.query(`INSERT INTO Designed_By (id_bg, designer_name) VALUES (?, ?)`, [id_bg, designer]);
    }
    await db.query(`DELETE FROM Published_By WHERE id_bg = ?`, [id_bg]);
    if (publisher && publisher.trim()) {
      await db.query(`INSERT INTO Published_By (id_bg, publisher_name) VALUES (?, ?)`, [id_bg, publisher]);
    }
    await db.query(`DELETE FROM Is_Of_Category WHERE id_bg = ?`, [id_bg]);
    if (category && category.trim()) {
      await db.query(`INSERT INTO Is_Of_Category (id_bg, category_name) VALUES (?, ?)`, [id_bg, category]);
    }
    await db.query(`DELETE FROM Uses_Mechanic WHERE id_bg = ?`, [id_bg]);
    if (meca_g && meca_g.trim()) {
      await db.query(`INSERT INTO Uses_Mechanic (id_bg, mechanic_name) VALUES (?, ?)`, [id_bg, meca_g]);
    }

    res.json({ message: "Game updated successfully!" });

  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/add', async (req, res) => {
  const {
    bg_id, title, description, release_date,
    min_p, max_p, time_p, minage,
    owned = 0, designer = [], wanting = 0, artwork_url = null,
    publisher = [], category = [], meca_g = [],
    user_rating = 0, average_rating = 0,
    game_extention_id = null, extansion_name = null
  } = req.body;

  const mandatoryFields = [
    "bg_id", "title", "description", "release_date",
    "min_p", "max_p", "time_p", "minage",
    "owned", "designer", "wanting", "publisher",
    "category", "meca_g"
  ];

  for (const field of mandatoryFields) {
    if (
      req.body[field] === undefined ||
      req.body[field] === null ||
      (typeof req.body[field] === "string" && req.body[field].trim() === "") ||
      (Array.isArray(req.body[field]) && req.body[field].length === 0)
    ) {
      return res.status(400).json({ message: `Field '${field}' is required.` });
    }
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();


    const unique = arr => [...new Set(arr.map(e => e.trim()).filter(Boolean))];

    const designers = unique(designer);
    const publishers = unique(publisher);
    const categories = unique(category);
    const mechanics = unique(meca_g);

    const refInsert = async (table, name) => {
      await conn.query(`INSERT IGNORE INTO ${table} (name) VALUES (?)`, [name]);
    };

    for (const name of designers) await refInsert('BG_Designer', name);
    for (const name of publishers) await refInsert('BG_Publisher', name);
    for (const name of categories) await refInsert('BG_Category', name);
    for (const name of mechanics) await refInsert('BG_Mechanic', name);


    const mainDesigner = designers[0] || null;
    const mainPublisher = publishers[0] || null;
    const mainCategory = categories[0] || null;
    const mainMechanic = mechanics[0] || null;

    const callProcedureSQL = `CALL AddBoardGameFull(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await conn.query(callProcedureSQL, [
      bg_id, title, description, release_date,
      min_p, max_p, time_p, minage,
      owned, wanting, artwork_url,
      user_rating, average_rating,
      mainDesigner, mainPublisher, mainCategory, mainMechanic
    ]);

 
    const insertRelation = async (table, idField, fieldName, items) => {
      for (const name of items.slice(1)) { 
        await conn.query(
          `INSERT IGNORE INTO ${table} (id_bg, ${fieldName}) VALUES (?, ?)`,
          [bg_id, name]
        );
      }
    };

    await insertRelation('Designed_By', 'id_bg', 'designer_name', designers);
    await insertRelation('Published_By', 'id_bg', 'publisher_name', publishers);
    await insertRelation('Is_Of_Category', 'id_bg', 'category_name', categories);
    await insertRelation('Uses_Mechanic', 'id_bg', 'mechanic_name', mechanics);


    if (game_extention_id && extansion_name) {
      await conn.query(
        `INSERT INTO BG_Expansion (id_bge, name, id_bg) VALUES (?, ?, ?)`,
        [game_extention_id, extansion_name, bg_id]
      );
    }

    await conn.commit();
    res.status(200).json({ message: "Game added via procedure successfully." });

  } catch (err) {
    await conn.rollback();
    console.error("DB error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});



  app.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}`);
  });
})();
