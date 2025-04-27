const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');

const db = new sqlite3.Database('./database/boardgames.sqlite');

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
    })
    .on('end', () => {
      console.log('Data import successfully completed');
      db.close();
    });
});
