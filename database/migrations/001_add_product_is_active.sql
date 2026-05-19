USE pos_system;

ALTER TABLE products
ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
