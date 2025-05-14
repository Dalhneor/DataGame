const fs = require("fs");
const mysql = require("mysql2/promise");
const csv = require("csv-parser");

// MySQL connection
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "azerty12",
    database: "boardgameDB",
};

function cleanListString(str) {
    if (!str || str === "NA") return [];
    try {
        return JSON.parse(str.replace(/'/g, '"'));
    } catch {
        return [];
    }
}

function cleanString(str) {
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#10;/g, '\n')
        .replace(/&#39;/g, "'")
        .trim();
}

(async () => {
    const connection = await mysql.createConnection(dbConfig);

    // Clear tables to avoid duplicate key issues
    await connection.execute(`DELETE FROM Is_Of_Category`);
    await connection.execute(`DELETE FROM Uses_Mechanic`);
    await connection.execute(`DELETE FROM Designed_By`);
    await connection.execute(`DELETE FROM Published_By`);
    await connection.execute(`DELETE FROM BG_Category`);
    await connection.execute(`DELETE FROM BG_Mechanic`);
    await connection.execute(`DELETE FROM BG_Designer`);
    await connection.execute(`DELETE FROM BG_Publisher`);
    await connection.execute(`DELETE FROM Board_Game`);

    const results = [];

    fs.createReadStream("boardgameDB.csv")
        .pipe(csv({ separator: ";" }))
        .on("data", (data) => results.push(data))
        .on("end", async () => {
            for (const row of results) {
                const id = parseInt(row.id);
                const name = cleanString(row.primary);
                const description = cleanString(row.description);
                let year = parseInt(row.yearpublished);
                if (isNaN(year) || year < 1800 || year > 2100) year = null;

                const minplayers = parseInt(row.minplayers);
                const maxplayers = parseInt(row.maxplayers);
                const time = parseInt(row.playingtime);
                const minage = parseInt(row.minage);
                const owned = parseInt(row.owned) || 0;
                const wanting = parseInt(row.wanting) || 0;
                const average = parseFloat(row.average) || 0;
                const usersRated = parseInt(row.users_rated) || 0;
                const img = row.thumbnail;

                // Insert into Board_Game
                await connection.execute(
                    `INSERT INTO Board_Game VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id,
                        name,
                        description,
                        year,
                        minplayers,
                        maxplayers,
                        time,
                        minage,
                        owned,
                        wanting,
                        img,
                        usersRated,
                        average,
                    ]
                );

                // Insert categories
                const categories = cleanListString(row.boardgamecategory);
                for (const cat of categories) {
                    await connection.execute(`INSERT IGNORE INTO BG_Category(name) VALUES (?)`, [cat]);
                    await connection.execute(`INSERT IGNORE INTO Is_Of_Category VALUES (?, ?)`, [id, cat]);
                }

                // Insert mechanics
                const mechanics = cleanListString(row.boardgamemechanic);
                for (const mech of mechanics) {
                    await connection.execute(`INSERT IGNORE INTO BG_Mechanic(name) VALUES (?)`, [mech]);
                    await connection.execute(`INSERT IGNORE INTO Uses_Mechanic VALUES (?, ?)`, [id, mech]);
                }

                // Insert designers
                const designers = cleanListString(row.boardgamedesigner);
                for (const designer of designers) {
                    await connection.execute(`INSERT IGNORE INTO BG_Designer(name) VALUES (?)`, [designer]);
                    await connection.execute(`INSERT IGNORE INTO Designed_By VALUES (?, ?)`, [id, designer]);
                }

                // Insert publishers
                const publishers = cleanListString(row.boardgamepublisher);
                for (const pub of publishers) {
                    await connection.execute(`INSERT IGNORE INTO BG_Publisher(name) VALUES (?)`, [pub]);
                    await connection.execute(`INSERT IGNORE INTO Published_By VALUES (?, ?)`, [id, pub]);
                }
            }

            console.log("Data imported successfully!");
            connection.end();
        });
})();
