const fs = require('fs');
const mysql2 = require('mysql2').verbose();
const csv = require('csv-parser');

const db = new mysql2.Database('./database/boardgames.sqlite');

db.serialize(() => {
  
  db.run(`CREATE TABLE IF NOT EXISTS Board_Game (
    id_bg INTEGER PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    yearpublished SMALLINT UNSIGNED NOT NULL,
    minplayers BIT NOT NULL,
    maxplayers BIT NOT NULL,
    playingtime SMALLINT,
    minage BIT NOT NULL,
    owned MEDIUMINT UNSIGNED,
    wanting SMALLINT UNSIGNED,
    img TEXT,
    users_rated INTEGER,
    average REAL
  )`);

  const tables = [
    `CREATE TABLE IF NOT EXISTS BG_Category (name VARCHAR(100) PRIMARY KEY)`,
    `CREATE TABLE IF NOT EXISTS BG_Mechanic (name VARCHAR(100) PRIMARY KEY)`,
    `CREATE TABLE IF NOT EXISTS BG_Designer (name VARCHAR(100) PRIMARY KEY)`,
    `CREATE TABLE IF NOT EXISTS BG_Publisher (name VARCHAR(100) PRIMARY KEY)`,
    `CREATE TABLE IF NOT EXISTS BG_Expansion (
      id_bge INTEGER PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      id_bg INTEGER,
      FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg)
    )`
  ];

  tables.forEach(query => db.run(query));

  const links = [
    `CREATE TABLE IF NOT EXISTS Is_Of_Category (
      id_bg INTEGER,
      category_name TEXT,
      FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg),
      FOREIGN KEY (category_name) REFERENCES BG_Category(name)
    )`,
    `CREATE TABLE IF NOT EXISTS Uses_Mechanic (
      id_bg INTEGER,
      mechanic_name TEXT,
      FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg),
      FOREIGN KEY (mechanic_name) REFERENCES BG_Mechanic(name)
    )`,
    `CREATE TABLE IF NOT EXISTS Designed_By (
      id_bg INTEGER,
      designer_name TEXT,
      FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg),
      FOREIGN KEY (designer_name) REFERENCES BG_Designer(name)
    )`,
    `CREATE TABLE IF NOT EXISTS Published_By (
      id_bg INTEGER,
      publisher_name TEXT,
      FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg),
      FOREIGN KEY (publisher_name) REFERENCES BG_Publisher(name)
    )`
  ];

  links.forEach(query => db.run(query));

  // CSV 
  fs.createReadStream('./database/boardgameDB.csv')
    .pipe(csv({ separator: ';' }))
    .on('data', (row) => {
      const id = parseInt(row.id);
      const name = row.primary;
      const description = row.description;
      const yearpublished = parseInt(row.yearpublished) || 0;
      const minplayers = parseInt(row.minplayers) || 0;
      const maxplayers = parseInt(row.maxplayers) || 0;
      const playingtime = parseInt(row.playingtime) || null;
      const minage = parseInt(row.minage) || 0;
      const owned = parseInt(row.owned) || 0;
      const wanting = parseInt(row.wanting) || 0;
      const img = row.thumbnail || '';
      const usersRated = parseInt(row.users_rated) || 0;
      const average = parseFloat(row.average) || 0;

      db.run('BEGIN TRANSACTION');

      db.run(`INSERT OR IGNORE INTO Board_Game
        (id_bg, name, description, yearpublished, minplayers, maxplayers, playingtime, minage, owned, wanting, img, users_rated, average)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, description, yearpublished, minplayers, maxplayers, playingtime, minage, owned, wanting, img, usersRated, average]
      );

      const parseList = (field) => {
        if (!field || typeof field !== 'string') return [];

        field = field.trim();
        if (field.startsWith('[') && field.endsWith(']')) {
          field = field.slice(1, -1);
        }
        const items = field.split(',');
        return items
          .map(item => item.trim().replace(/^['"]|['"]$/g, ''))
          .filter(item => item.length > 0);
      };

      const insertEntities = (values, tableName, linkTable, columnName) => {
        values.forEach(value => {
          if (value) {
            db.run(`INSERT OR IGNORE INTO ${tableName} (name) VALUES (?)`, [value]);
            db.run(`INSERT OR IGNORE INTO ${linkTable} (id_bg, ${columnName}) VALUES (?, ?)`, [id, value]);
          }
        });
      };

      insertEntities(parseList(row.boardgamecategory), 'BG_Category', 'Is_Of_Category', 'category_name');
      insertEntities(parseList(row.boardgamemechanic), 'BG_Mechanic', 'Uses_Mechanic', 'mechanic_name');
      insertEntities(parseList(row.boardgamedesigner), 'BG_Designer', 'Designed_By', 'designer_name');
      insertEntities(parseList(row.boardgamepublisher), 'BG_Publisher', 'Published_By', 'publisher_name');

      const expansions = parseList(row.boardgameexpansion);
      expansions.forEach((exp, i) => {
        const fakeIdBge = id * 1000 + i;
        db.run(`INSERT OR IGNORE INTO BG_Expansion (id_bge, name, id_bg) VALUES (?, ?, ?)`, [fakeIdBge, exp, id]);
      });

      db.run('COMMIT');
    })
    .on('end', () => {
      console.log('Data import successfully completed');
      db.close();
    });
     //Views

  db.run(`CREATE VIEW IF NOT EXISTS Detailed_Game_Info AS
    SELECT bg.id_bg, bg.name, bg.description, bg.yearpublished, bg.minplayers, bg.maxplayers, bg.playingtime, bg.minage, bg.owned, bg.wanting, bg.img, bg.users_rated, bg.average,
      GROUP_CONCAT(DISTINCT c.category_name) AS categories,
      GROUP_CONCAT(DISTINCT m.mechanic_name) AS mechanics,
      GROUP_CONCAT(DISTINCT d.designer_name) AS designers,
      GROUP_CONCAT(DISTINCT p.publisher_name) AS publishers
    FROM Board_Game bg
    LEFT JOIN Is_Of_Category c ON bg.id_bg = c.id_bg
    LEFT JOIN Uses_Mechanic m ON bg.id_bg = m.id_bg
    LEFT JOIN Designed_By d ON bg.id_bg = d.id_bg
    LEFT JOIN Published_By p ON bg.id_bg = p.id_bg
    GROUP BY bg.id_bg
  `);

  db.run(`CREATE VIEW IF NOT EXISTS Resume_Game_Info AS
    SELECT name, yearpublished, minplayers, maxplayers, playingtime, img
    FROM Board_Game
    ORDER BY name
  `);

  db.run(`CREATE VIEW IF NOT EXISTS Top_Rated_Games AS
    SELECT id_bg, name, average, users_rated, yearpublished, playingtime, minage
    FROM Board_Game
    WHERE users_rated > 1000
    ORDER BY average DESC
    LIMIT 10
  `);

  //Index
  db.run(`CREATE INDEX IF NOT EXISTS idx_publisher_game ON Published_By(publisher_name, id_bg)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_category_game ON Is_Of_Category(category_name, id_bg)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_mechanic_name ON Uses_Mechanic(mechanic_name)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_designer_game ON Designed_By(designer_name, id_bg)`);

  //Trigger with RAISE
  db.run(`CREATE TRIGGER IF NOT EXISTS trg_prevent_duplicate_publisher
  BEFORE INSERT ON Published_By
  FOR EACH ROW
  WHEN EXISTS (
    SELECT 1 FROM Published_By
    WHERE id_bg = NEW.id_bg AND publisher_name = NEW.publisher_name
  )
  BEGIN
    SELECT RAISE(FAIL, 'Duplicate publisher entry for this game.');
  END
  `);

  db.run(`CREATE TRIGGER IF NOT EXISTS trg_check_min_age
  BEFORE INSERT ON Board_Game
  FOR EACH ROW
  WHEN NEW.minage < 0
  BEGIN
    SELECT RAISE(FAIL, 'Minimum age must be non-negative.');
  END
  `);

  db.run(`CREATE TRIGGER IF NOT EXISTS trg_check_players
  BEFORE INSERT ON Board_Game
  FOR EACH ROW
  WHEN NEW.minplayers > NEW.maxplayers
  BEGIN
    SELECT RAISE(FAIL, 'Minimum players cannot exceed maximum players.');
  END
  `);

  db.run(`CREATE TRIGGER IF NOT EXISTS trg_delete_expansions
  AFTER DELETE ON Board_Game
  FOR EACH ROW
  BEGIN
    DELETE FROM BG_Expansion WHERE id_bg = OLD.id_bg;
  END
  `);
});
