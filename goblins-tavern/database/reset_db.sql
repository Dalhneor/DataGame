DROP DATABASE IF EXISTS boardgameDB;
CREATE DATABASE boardgameDB;
USE boardgameDB;

CREATE TABLE IF NOT EXISTS Board_Game (
                                          id_bg INTEGER PRIMARY KEY,
                                          name VARCHAR(150) NOT NULL,
                                          description TEXT NOT NULL,
                                          yearpublished INT UNSIGNED DEFAULT NULL,
                                          minplayers TINYINT UNSIGNED NOT NULL,
                                          maxplayers TINYINT UNSIGNED NOT NULL,
                                          playingtime SMALLINT,
                                          minage TINYINT UNSIGNED NOT NULL,
                                          owned MEDIUMINT UNSIGNED,
                                          wanting SMALLINT UNSIGNED,
                                          img TEXT,
                                          users_rated INTEGER,
                                          average REAL);

CREATE TABLE IF NOT EXISTS BG_Category (name VARCHAR(100) PRIMARY KEY);

CREATE TABLE IF NOT EXISTS BG_Mechanic (name VARCHAR(100) PRIMARY KEY);

CREATE TABLE IF NOT EXISTS BG_Designer (name VARCHAR(100) PRIMARY KEY);

CREATE TABLE IF NOT EXISTS BG_Publisher (name VARCHAR(100) PRIMARY KEY);

CREATE TABLE IF NOT EXISTS BG_Expansion (
                                            id_bge INTEGER PRIMARY KEY,
                                            name VARCHAR(150) NOT NULL,
                                            id_bg INTEGER,
                                            FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg));

CREATE TABLE IF NOT EXISTS Is_Of_Category (
                                              id_bg INTEGER,
                                              category_name VARCHAR(100),
                                              PRIMARY KEY (id_bg, category_name),
                                              FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg),
                                              FOREIGN KEY (category_name) REFERENCES BG_Category(name)
);
CREATE TABLE IF NOT EXISTS Uses_Mechanic (
                                             id_bg INTEGER,
                                             mechanic_name VARCHAR(100),
                                             PRIMARY KEY (id_bg, mechanic_name),
                                             FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg),
                                             FOREIGN KEY (mechanic_name) REFERENCES BG_Mechanic(name)
);
CREATE TABLE IF NOT EXISTS Designed_By (
                                           id_bg INTEGER,
                                           designer_name VARCHAR(100),
                                           PRIMARY KEY (id_bg, designer_name),
                                           FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg),
                                           FOREIGN KEY (designer_name) REFERENCES BG_Designer(name)
);
CREATE TABLE IF NOT EXISTS Published_By (
                                            id_bg INTEGER,
                                            publisher_name VARCHAR(100),
                                            PRIMARY KEY (id_bg, publisher_name),
                                            FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg),
                                            FOREIGN KEY (publisher_name) REFERENCES BG_Publisher(name)
);

-- Resume/essential information ICI
CREATE VIEW Resume_Game_Info AS
SELECT name, yearpublished, minplayers, maxplayers, playingtime, img
FROM Board_Game
ORDER BY name;

-- Top 10 games based on average rating
CREATE VIEW Top_Rated_Games AS
SELECT id_bg, name, average, users_rated, yearpublished, playingtime, minage, img
FROM Board_Game
WHERE users_rated > 1000
ORDER BY average DESC
LIMIT 10;


-- ========================================
--               INDEXES ICI
-- ========================================

CREATE INDEX idx_publisher_game ON Published_By(publisher_name, id_bg);
CREATE INDEX idx_category_game ON Is_Of_Category(category_name, id_bg);
CREATE INDEX idx_mechanic_name ON Uses_Mechanic(mechanic_name);
CREATE INDEX idx_designer_game ON Designed_By(designer_name, id_bg);

-- ========================================
--               TRIGGERS 
-- ========================================

-- Prevent duplicate publishers
DELIMITER $$
CREATE TRIGGER trg_prevent_duplicate_publisher
BEFORE INSERT ON Published_By
FOR EACH ROW
BEGIN
    IF EXISTS (
        SELECT 1 FROM Published_By 
        WHERE id_bg = NEW.id_bg AND publisher_name = NEW.publisher_name
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate publisher entry for this game.';
    END IF;
END$$
DELIMITER ;

-- Minimum age must be non-negative
DELIMITER $$
CREATE TRIGGER trg_check_min_age
BEFORE INSERT ON Board_Game
FOR EACH ROW
BEGIN
    IF NEW.minage < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Minimum age must be non-negative.';
    END IF;
END$$
DELIMITER ;

-- Delete expansions when base game is deleted
DELIMITER $$
CREATE TRIGGER trg_delete_expansions
AFTER DELETE ON Board_Game
FOR EACH ROW
BEGIN
    DELETE FROM BG_Expansion
    WHERE id_bg = OLD.id_bg;
END$$
DELIMITER ;

-- ========================================
--           STORED PROCEDURES
-- ========================================

-- Add a complete new board game
DELIMITER $$
CREATE PROCEDURE AddBoardGameFull(
    IN p_id_bg INT,
    IN p_name VARCHAR(255),
    IN p_description TEXT,
    IN p_year INT,
    IN p_minplayers INT,
    IN p_maxplayers INT,
    IN p_playingtime INT,
    IN p_minage INT,
    IN p_owned INT,
    IN p_wanting INT,
    IN p_img VARCHAR(255),
    IN p_users_rated INT,
    IN p_average FLOAT,
    IN p_designer_name VARCHAR(255),
    IN p_publisher_name VARCHAR(255),
    IN p_category_name VARCHAR(255),
    IN p_mechanic_name VARCHAR(255)
)
BEGIN
    INSERT INTO Board_Game (
        id_bg, name, description, yearpublished, minplayers, maxplayers, playingtime,
        minage, owned, wanting, img, users_rated, average
    )
    VALUES (
        p_id_bg, p_name, p_description, p_year, p_minplayers, p_maxplayers,
        p_playingtime, p_minage, p_owned, p_wanting, p_img, p_users_rated, p_average
    );

    INSERT INTO Designed_By (id_bg, designer_name)
    VALUES (p_id_bg, p_designer_name);

    INSERT INTO Published_By (id_bg, publisher_name)
    VALUES (p_id_bg, p_publisher_name);

    INSERT INTO Is_Of_Category (id_bg, category_name)
    VALUES (p_id_bg, p_category_name);

    INSERT INTO Uses_Mechanic (id_bg, mechanic_name)
    VALUES (p_id_bg, p_mechanic_name);
END$$
DELIMITER ;

-- Get all game details
DELIMITER $$
CREATE PROCEDURE GetBoardGameDetails(IN p_id_bg INT)
BEGIN
    SELECT * FROM Board_Game WHERE id_bg = p_id_bg;
    SELECT category_name FROM Is_Of_Category WHERE id_bg = p_id_bg;
    SELECT mechanic_name FROM Uses_Mechanic WHERE id_bg = p_id_bg;
    SELECT designer_name FROM Designed_By WHERE id_bg = p_id_bg;
    SELECT publisher_name FROM Published_By WHERE id_bg = p_id_bg;
END$$
DELIMITER ;

-- Get all games by category
DELIMITER $$
CREATE PROCEDURE GetGamesByCategory(IN p_category_name VARCHAR(255))
BEGIN
    SELECT bg.* FROM Board_Game bg
    JOIN Is_Of_Category ioc ON bg.id_bg = ioc.id_bg
    WHERE ioc.category_name = p_category_name;
END$$
DELIMITER ;

-- Get all games by designer
DELIMITER $$
CREATE PROCEDURE GetGamesByDesigner(IN p_designer_name VARCHAR(255))
BEGIN
    SELECT bg.* FROM Board_Game bg
    JOIN Designed_By db ON bg.id_bg = db.id_bg
    WHERE db.designer_name = p_designer_name;
END$$
DELIMITER ;


CREATE OR REPLACE VIEW Detailed_Game_Info AS
SELECT 
    bg.id_bg,
    MAX(bg.name) AS name,
    MAX(bg.description) AS description,
    MAX(bg.yearpublished) AS yearpublished,
    MAX(bg.minplayers) AS minplayers,
    MAX(bg.maxplayers) AS maxplayers,
    MAX(bg.playingtime) AS playingtime,
    MAX(bg.minage) AS minage,
    MAX(bg.owned) AS owned,
    MAX(bg.wanting) AS wanting,
    MAX(bg.img) AS img,
    MAX(bg.users_rated) AS users_rated,
    MAX(bg.average) AS average,
    GROUP_CONCAT(DISTINCT c.category_name) AS categories,
    GROUP_CONCAT(DISTINCT m.mechanic_name) AS mechanics,
    GROUP_CONCAT(DISTINCT d.designer_name) AS designers,
    GROUP_CONCAT(DISTINCT p.publisher_name) AS publishers
FROM Board_Game bg
LEFT JOIN Is_Of_Category c ON bg.id_bg = c.id_bg
LEFT JOIN Uses_Mechanic m ON bg.id_bg = m.id_bg
LEFT JOIN Designed_By d ON bg.id_bg = d.id_bg
LEFT JOIN Published_By p ON bg.id_bg = p.id_bg
GROUP BY bg.id_bg;

-- Drop old constraints
ALTER TABLE BG_Expansion DROP FOREIGN KEY BG_Expansion_ibfk_1;
ALTER TABLE Is_Of_Category DROP FOREIGN KEY Is_Of_Category_ibfk_1;
ALTER TABLE Uses_Mechanic DROP FOREIGN KEY Uses_Mechanic_ibfk_1;
ALTER TABLE Designed_By DROP FOREIGN KEY Designed_By_ibfk_1;
ALTER TABLE Published_By DROP FOREIGN KEY Published_By_ibfk_1;

-- Re-add them with ON DELETE CASCADE
ALTER TABLE BG_Expansion 
    ADD CONSTRAINT fk_bgexpansion_boardgame 
    FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg) 
    ON DELETE CASCADE;

ALTER TABLE Is_Of_Category 
    ADD CONSTRAINT fk_isofcategory_boardgame 
    FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg) 
    ON DELETE CASCADE;

ALTER TABLE Uses_Mechanic 
    ADD CONSTRAINT fk_usesmechanic_boardgame 
    FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg) 
    ON DELETE CASCADE;

ALTER TABLE Designed_By 
    ADD CONSTRAINT fk_designedby_boardgame 
    FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg) 
    ON DELETE CASCADE;

ALTER TABLE Published_By 
    ADD CONSTRAINT fk_publishedby_boardgame 
    FOREIGN KEY (id_bg) REFERENCES Board_Game(id_bg) 
    ON DELETE CASCADE;


SELECT * FROM Board_Game
WHERE id_bg = 123456;
SELECT * FROM Is_Of_Category WHERE id_bg = 123456;

DELETE FROM Board_Game WHERE id_bg = 123456;



