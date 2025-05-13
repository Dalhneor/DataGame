const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./database/boardgames.sqlite');
const PORT = 3000;

app.use(cors());
app.use(express.static('HTML'));
app.use(express.json());

app.get('/api/boardgames', (req, res) => {
  const query = `
    SELECT 
      bg.*
    FROM Board_Game bg
    LIMIT 100
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/game-details', (req, res) => {
  const { id_bg } = req.body;

  if (!id_bg) {
    return res.status(400).json({ error: "id_bg is required" });
  }

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
    LEFT JOIN Designed_By AS db ON bg.id_bg = db.id_bg
    LEFT JOIN BG_Designer AS d ON db.designer_name = d.name
    LEFT JOIN Published_By AS pb ON bg.id_bg = pb.id_bg
    LEFT JOIN BG_Publisher AS p ON pb.publisher_name = p.name
    LEFT JOIN Uses_Mechanic AS um ON bg.id_bg = um.id_bg
    LEFT JOIN BG_Mechanic AS m ON um.mechanic_name = m.name
    LEFT JOIN Is_Of_Category AS cat ON bg.id_bg = cat.id_bg
    LEFT JOIN BG_Category AS bgc ON cat.category_name = bgc.name
    LEFT JOIN BG_Expansion AS bge ON bg.id_bg = bge.id_bg
    WHERE bg.id_bg = ?
    GROUP BY bg.id_bg
  `;

  db.get(query, [id_bg], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Board game not found" });

    res.json(row);
  });
});

app.post('/api/search', (req, res) => {
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
    keywords.forEach(kw => {
      query += ` AND (name LIKE ? OR description LIKE ?)`;
      params.push(`%${kw}%`, `%${kw}%`);
    });
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/deletebg/:id', (req, res) => {
  const gameId = req.params.id;

  const sql = `SELECT id_bg, name FROM Board_Game WHERE id_bg = ?`;

  db.get(sql, [gameId], (err, row) => {
    if (err) {
      console.error("Error fetching board game:", err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Board Game not found." });
    }
    res.json(row);
  });
});

app.delete('/api/boardgames/:id', (req, res) => {
  const gameId = req.params.id;

  const queries = [
    `DELETE FROM Designed_By WHERE id_bg = ?`,
    `DELETE FROM Published_By WHERE id_bg = ?`,
    `DELETE FROM Is_Of_Category WHERE id_bg = ?`,
    `DELETE FROM Uses_Mechanic WHERE id_bg = ?`,
    `DELETE FROM BG_Expansion WHERE id_bg = ?`,
    `DELETE FROM Board_Game WHERE id_bg = ?`
  ];
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    let completed = 0;
    let hasError = false;

    queries.forEach((sql) => {
      db.run(sql, [gameId], function (err) {
        if (err) {
          console.error("Error executing:", sql, "Error:", err.message);
          hasError = true;
        }

        completed++;
        if (completed === queries.length) {
          if (hasError) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: "Error deleting some related data." });
          } else {
            db.run('COMMIT');
            return res.status(200).json({ message: "Board Game and all related data deleted successfully!" });
          }
        }
      });
    });
  });
});

app.post('/api/add', (req, res) => {
  const {
    bg_id, title, description, release_date,
    min_p, max_p, time_p, minage,
    owned, designer, wanting, artwork_url,
    publisher, category, meca_g,
    user_rating, average_rating,
    game_extention_id, extansion_name
  } = req.body;

  if (
    !bg_id || !title || !description || !release_date ||
    min_p == null || max_p == null || time_p == null || minage == null
  ) {
    return res.status(400).json({ message: "Please fill in all mandatory fields." });
  }
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const sql = `
      INSERT OR IGNORE INTO Board_Game 
      (id_bg, name, description, yearpublished, minplayers, maxplayers, playingtime, minage, owned, wanting, img, users_rated, average)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [bg_id, title, description, release_date, min_p, max_p, time_p, minage, owned, wanting, artwork_url, user_rating, average_rating], function (err) {
      if (err) {
        console.error('Error inserting Board_Game:', err.message);
        return res.status(500).json({ error: err.message });
      }

      const responses = [];

      const insertMultiple = (valuesString, insertTable, linkTable, nameColumn, linkNameColumn) => {
        if (!valuesString) return;

        const values = Array.isArray(valuesString) ? valuesString : valuesString.split(',').map(val => val.trim());
        values.forEach(value => {
          db.get(`SELECT ${nameColumn} FROM ${insertTable} WHERE ${nameColumn} = ?`, [value], (err, row) => {
            if (err) {
              console.error(`Error selecting from ${insertTable}:`, err.message);
              return;
            }

            const insertRelation = () => {
              db.run(`INSERT INTO ${linkTable} (id_bg, ${linkNameColumn}) VALUES (?, ?)`, [bg_id, value], (err) => {
                if (err) {
                  console.error(`Error inserting into ${linkTable}:`, err.message);
                }
              });
            };

            if (!row) {
              db.run(`INSERT INTO ${insertTable} (${nameColumn}) VALUES (?)`, [value], (err) => {
                if (err) {
                  console.error(`Error inserting into ${insertTable}:`, err.message);
                  return;
                }
                insertRelation();
              });
            } else {
              insertRelation();
            }
          });
        });
      };

      insertMultiple(designer, 'BG_Designer', 'Designed_By', 'designer_name', 'designer_name');
      insertMultiple(publisher, 'BG_Publisher', 'Published_By', 'publisher_name', 'publisher_name');
      insertMultiple(category, 'BG_Category', 'Is_Of_Category', 'category_name', 'category_name');
      insertMultiple(meca_g, 'BG_Mechanic', 'Uses_Mechanic', 'mechanic_name', 'mechanic_name');

      if (game_extention_id && extansion_name) {
        db.run(`INSERT OR IGNORE INTO BG_Expansion (id_bge, name, id_bg) VALUES (?, ?, ?)`,
          [game_extention_id, extansion_name, bg_id]);
        responses.push('Expansion inserted');
      }
      db.run('COMMIT');
      res.status(200).json({ message: "Board game and related data added (with multi-insertions by name)", details: responses });
    });
  });
});

app.post('/api/update', (req, res) => {
  const {
    id_bg, title, description, release_date,
    min_p, max_p, time_p, minage,
    owned, wanting, artwork_url,
    designer, publisher, category, meca_g,
    user_rating, average_rating,
    game_extention_id, extansion_name
  } = req.body;

  if (!id_bg) {
    return res.status(400).json({ error: "Board Game ID is required." });
  }

  const queries = [];

  queries.push({
    sql: `UPDATE Board_Game SET name=?, description=?, yearpublished=?, minplayers=?, maxplayers=?, playingtime=?, minage=?, owned=?, wanting=?, img=?, users_rated=?, average=? WHERE id_bg=?`,
    params: [title, description, release_date, min_p, max_p, time_p, minage, owned, wanting, artwork_url, user_rating, average_rating, id_bg]
  });

  queries.push({ sql: `DELETE FROM Designed_By WHERE id_bg=?`, params: [id_bg] });
  queries.push({ sql: `DELETE FROM Published_By WHERE id_bg=?`, params: [id_bg] });
  queries.push({ sql: `DELETE FROM Is_Of_Category WHERE id_bg=?`, params: [id_bg] });
  queries.push({ sql: `DELETE FROM Uses_Mechanic WHERE id_bg=?`, params: [id_bg] });

  if (designer) {
    const designers = designer.split(";").map(d => d.trim());
    designers.forEach(d => {
      queries.push({ sql: `INSERT OR IGNORE INTO BG_Designer (name) VALUES (?)`, params: [d] });
      queries.push({ sql: `INSERT INTO Designed_By (id_bg, designer_name) VALUES (?, ?)`, params: [id_bg, d] });
    });
  }

  if (publisher) {
    const publishers = publisher.split(";").map(p => p.trim());
    publishers.forEach(p => {
      queries.push({ sql: `INSERT OR IGNORE INTO BG_Publisher (name) VALUES (?)`, params: [p] });
      queries.push({ sql: `INSERT INTO Published_By (id_bg, publisher_name) VALUES (?, ?)`, params: [id_bg, p] });
    });
  }

  if (category) {
    const categories = category.split(";").map(c => c.trim());
    categories.forEach(c => {
      queries.push({ sql: `INSERT OR IGNORE INTO BG_Category (name) VALUES (?)`, params: [c] });
      queries.push({ sql: `INSERT INTO Is_Of_Category (id_bg, category_name) VALUES (?, ?)`, params: [id_bg, c] });
    });
  }

  if (meca_g) {
    const mechanics = meca_g.split(";").map(m => m.trim());
    mechanics.forEach(m => {
      queries.push({ sql: `INSERT OR IGNORE INTO BG_Mechanic (name) VALUES (?)`, params: [m] });
      queries.push({ sql: `INSERT INTO Uses_Mechanic (id_bg, mechanic_name) VALUES (?, ?)`, params: [id_bg, m] });
    });
  }

  if (game_extention_id && extansion_name) {
    queries.push({
      sql: `INSERT OR REPLACE INTO BG_Expansion (id_bge, name, id_bg) VALUES (?, ?, ?)`,
      params: [game_extention_id, extansion_name, id_bg]
    });
  }

  let index = 0;
  function runNext() {
    if (index >= queries.length) {
      return res.status(200).json({ message: "Game and related data updated successfully!" });
    }
    const q = queries[index++];
    db.serialize(() => {
    db.run('BEGIN TRANSACTION');
      db.run(q.sql, q.params, (err) => {
        if (err) {
          db.run('ROLLBACK');
          console.error(`Error executing: ${q.sql}`, err.message);
          return res.status(500).json({ error: err.message });
        }
        db.run('COMMIT');
        });
        runNext();
      });
    }

  runNext();
});

app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
