-- =====================================================================
--  Sample data (mirrors frontend/src/api/seed.js)
--  Passwords below are bcrypt hashes. Generate real ones with:  node backend/scripts/hash.js <password>
--  Demo logins after running  `npm run seed:users`  in /backend :
--     admin@ecocycle.in / admin123 · rahul@ecocycle.in / collect123 · priya@example.com / user123
--  The placeholder hash 'REPLACE_WITH_BCRYPT' is overwritten by that script.
-- =====================================================================

INSERT INTO app_user (full_name, email, password_hash, phone, role, address) VALUES ('Admin User','admin@ecocycle.in','REPLACE_WITH_BCRYPT','9800000001','ADMIN','EcoCycle HQ, Panaji, Goa');
INSERT INTO app_user (full_name, email, password_hash, phone, role, address) VALUES ('Rahul Naik','rahul@ecocycle.in','REPLACE_WITH_BCRYPT','9800000002','COLLECTOR','Margao, Goa');
INSERT INTO app_user (full_name, email, password_hash, phone, role, address) VALUES ('Meera Kamat','meera@ecocycle.in','REPLACE_WITH_BCRYPT','9800000003','COLLECTOR','Mapusa, Goa');
INSERT INTO app_user (full_name, email, password_hash, phone, role, address) VALUES ('Priya Desai','priya@example.com','REPLACE_WITH_BCRYPT','9800000004','USER','12, Rua de Ourem, Panaji, Goa');
INSERT INTO app_user (full_name, email, password_hash, phone, role, address) VALUES ('Arjun Shetty','arjun@example.com','REPLACE_WITH_BCRYPT','9800000005','USER','Vasco da Gama, Goa');
INSERT INTO app_user (full_name, email, password_hash, phone, role, address) VALUES ('Sneha Fernandes','sneha@example.com','REPLACE_WITH_BCRYPT','9800000006','USER','Porvorim, Goa');

INSERT INTO ewaste_category (name, description, hazard_level) VALUES ('Mobile Phones','Smartphones, feature phones and accessories','Medium');
INSERT INTO ewaste_category (name, description, hazard_level) VALUES ('Laptops & Computers','Laptops, desktops, monitors, keyboards','Medium');
INSERT INTO ewaste_category (name, description, hazard_level) VALUES ('Batteries','Li-ion, lead-acid and alkaline batteries','High');
INSERT INTO ewaste_category (name, description, hazard_level) VALUES ('Large Appliances','Refrigerators, washing machines, ACs','Medium');
INSERT INTO ewaste_category (name, description, hazard_level) VALUES ('Small Appliances','Mixers, irons, toasters, hair dryers','Low');
INSERT INTO ewaste_category (name, description, hazard_level) VALUES ('Televisions & Displays','CRT, LCD and LED televisions','High');
INSERT INTO ewaste_category (name, description, hazard_level) VALUES ('Printers & Peripherals','Printers, scanners, routers, cables','Low');
INSERT INTO ewaste_category (name, description, hazard_level) VALUES ('Lighting Equipment','CFL, LED tubes and fixtures','Medium');

INSERT INTO collector (user_id, vehicle_no, area) VALUES (2,'GA-07-T-4421','South Goa');
INSERT INTO collector (user_id, vehicle_no, area) VALUES (3,'GA-03-K-9087','North Goa');

INSERT INTO recycling_facility (name, location, capacity_kg, certification) VALUES ('GreenLoop Recyclers','Verna Industrial Estate',5000,'CPCB Authorised');
INSERT INTO recycling_facility (name, location, capacity_kg, certification) VALUES ('Eco Reclaim Pvt Ltd','Pilerne, Bardez',3200,'ISO 14001');
INSERT INTO recycling_facility (name, location, capacity_kg, certification) VALUES ('Urban Mine Works','Tivim Industrial Area',2400,'CPCB Authorised');

-- A few requests in different states (the trigger fills status_history automatically)
INSERT INTO collection_request (user_id, category_id, item_name, quantity, item_condition, pickup_address, preferred_date, status, collector_id, scheduled_date, collected_on)
VALUES (4,1,'Samsung Galaxy S8',2,'Dead','12, Rua de Ourem, Panaji, Goa', SYSDATE-93,'Pending',NULL,NULL,NULL);
INSERT INTO collection_request (user_id, category_id, item_name, quantity, item_condition, pickup_address, preferred_date, status, collector_id, scheduled_date, collected_on)
VALUES (5,2,'Dell Inspiron 15',1,'Damaged','Vasco da Gama, Goa', SYSDATE-86,'Pending',NULL,NULL,NULL);
INSERT INTO collection_request (user_id, category_id, item_name, quantity, item_condition, pickup_address, preferred_date, status, collector_id, scheduled_date, collected_on)
VALUES (6,3,'UPS Lead-acid Batteries',4,'Dead','Porvorim, Goa', SYSDATE-78,'Pending',NULL,NULL,NULL);
INSERT INTO collection_request (user_id, category_id, item_name, quantity, item_condition, pickup_address, preferred_date, status, collector_id, scheduled_date, collected_on)
VALUES (4,6,'Sony CRT Television',1,'Working','12, Rua de Ourem, Panaji, Goa', SYSDATE-70,'Pending',NULL,NULL,NULL);
INSERT INTO collection_request (user_id, category_id, item_name, quantity, item_condition, pickup_address, preferred_date, status)
VALUES (4,3,'Laptop Batteries',5,'Dead','12, Rua de Ourem, Panaji, Goa', SYSDATE+2,'Pending');
INSERT INTO collection_request (user_id, category_id, item_name, quantity, item_condition, pickup_address, preferred_date, status)
VALUES (5,4,'Whirlpool Washing Machine',1,'Damaged','Vasco da Gama, Goa', SYSDATE+3,'Pending');

-- Move the first four through the workflow (each UPDATE is logged by the trigger)
UPDATE collection_request SET collector_id=1, scheduled_date=SYSDATE-88, status='Assigned'  WHERE request_id=1;
UPDATE collection_request SET collected_on=SYSDATE-85, status='Collected'                  WHERE request_id=1;
UPDATE collection_request SET status='Processing'                                          WHERE request_id=1;
INSERT INTO processing_record (request_id, facility_id, weight_kg, process_status, final_status, processed_on) VALUES (1,1,0.4,'Completed','Recycled',SYSDATE-70);
UPDATE collection_request SET status='Recycled' WHERE request_id=1;

UPDATE collection_request SET collector_id=2, scheduled_date=SYSDATE-75, status='Assigned'  WHERE request_id=3;
UPDATE collection_request SET collected_on=SYSDATE-72, status='Collected'                  WHERE request_id=3;
UPDATE collection_request SET status='Processing'                                          WHERE request_id=3;
INSERT INTO processing_record (request_id, facility_id, weight_kg, process_status, final_status, processed_on) VALUES (3,2,62,'Completed','Disposed',SYSDATE-60);
UPDATE collection_request SET status='Disposed' WHERE request_id=3;

UPDATE collection_request SET collector_id=1, scheduled_date=SYSDATE+1, status='Assigned'   WHERE request_id=2;

COMMIT;
