DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS species;
DROP TABLE IF EXISTS plants;
DROP TABLE IF EXISTS care_types;
DROP TABLE IF EXISTS plant_care;

-- ============================
-- Users
-- ============================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- Species
-- ============================
CREATE TABLE species (
    id SERIAL PRIMARY KEY,
    common_name TEXT NOT NULL,
    scientific_name TEXT,
    sunlight TEXT,
    water TEXT,
    perenual_id INT
);

-- ============================
-- Plants
-- ============================
CREATE TABLE plants (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    species_id INT REFERENCES species(id),
    nickname TEXT,
    date_added DATE DEFAULT CURRENT_DATE,
    last_watered DATE,
    location TEXT
);

-- ============================
-- Care Types
-- ============================
CREATE TABLE care_types (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT
);

-- ============================
-- Plant Care Logs
-- ============================
CREATE TABLE plant_care (
    id SERIAL PRIMARY KEY,
    plant_id INT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    care_type_id INT NOT NULL REFERENCES care_types(id),
    note TEXT,
    care_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

