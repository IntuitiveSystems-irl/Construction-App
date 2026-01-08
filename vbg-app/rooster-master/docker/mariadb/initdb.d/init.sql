-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS rooster_db;

-- Create the user if it doesn't exist
CREATE USER IF NOT EXISTS 'rooster_user'@'%' IDENTIFIED BY '4Underoath7@';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON rooster_db.* TO 'rooster_user'@'%';

-- Apply the changes
FLUSH PRIVILEGES;
