USE pos_system;

ALTER TABLE sale_items
  ADD COLUMN item_type ENUM('bar', 'food') NOT NULL DEFAULT 'bar' AFTER sale_id,
  ADD COLUMN menu_item_id INT NULL AFTER product_id;

ALTER TABLE sale_items
  MODIFY product_id INT NULL;

ALTER TABLE sale_items
  ADD CONSTRAINT fk_sale_items_menu_item
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id);
