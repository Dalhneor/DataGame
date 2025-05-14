DROP DATABASE IF EXISTS boardgameDB;
CREATE DATABASE boardgameDB;
USE boardgameDB;

CREATE TABLE IF NOT EXISTS Board_Game (
                                          id_bg INTEGER PRIMARY KEY,
                                          name VARCHAR(150) NOT NULL,
                                          description TEXT NOT NULL,
                                          yearpublished SMALLINT UNSIGNED NOT NULL,
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

