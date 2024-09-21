-- secretsanta.sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  spouse VARCHAR(100)
);

-- secretsanta.sql
CREATE TABLE pairs (
  id SERIAL PRIMARY KEY,
  giver VARCHAR(100) NOT NULL,
  receiver VARCHAR(100) NOT NULL
);

ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE NOT NULL;