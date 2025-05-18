# Goblin's Tavern

The aim of this project is to create a site featuring a large number of board games, while keeping the site as green as possible.

## Features

- Search a Board Game on specific point, like name, category, 
- Add a Board Game if you are an administrator
- Delete a Board Game by it's ID if you are an administrator
- Modify a Board Game information if you are and administrator

## Installation

-> need to run the my sql script "reset_db.sql" in my sql workbench.
-> In "server.js" change the XXX to your identifier : 
(async () => {
  const db = await mysql.createPool({
    host: "localhost",
    user: "XXX",
    password: "XXX",
    database: "boardgameDB",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  -> run populate.js with node populate.js in a terminal

Open a terminal and them enter:
- cd goblins-tavern 
- node server.js


