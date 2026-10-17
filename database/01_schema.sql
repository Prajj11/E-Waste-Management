-- =====================================================================
--  E-Waste Management System : Oracle Database schema (12c or later)
--  Run as the application user:  sqlplus ewaste/ewaste@//localhost:1521/XEPDB1 @01_schema.sql
-- =====================================================================

-- Clean re-run (ignore errors if objects do not exist yet)
BEGIN
  FOR t IN (SELECT table_name FROM user_tables
            WHERE table_name IN ('PROCESSING_RECORD','STATUS_HISTORY','COLLECTION_REQUEST','COLLECTOR',
                                 'RECYCLING_FACILITY','EWASTE_CATEGORY','APP_USER')) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS PURGE';
  END LOOP;
END;
/

-- 1. USERS (users, collectors and admins share one login table) ------------------------
CREATE TABLE app_user (
  user_id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name      VARCHAR2(100)  NOT NULL,
  email          VARCHAR2(120)  NOT NULL,
  password_hash  VARCHAR2(100)  NOT NULL,           -- bcrypt hash, never plain text
  phone          VARCHAR2(15),
  role           VARCHAR2(10)   DEFAULT 'USER' NOT NULL,
  address        VARCHAR2(300),
  created_at     TIMESTAMP      DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT uq_user_email UNIQUE (email),
  CONSTRAINT ck_user_role  CHECK (role IN ('USER','COLLECTOR','ADMIN'))
);

-- 2. E-WASTE CATEGORY ---------------------------------------------------------------
CREATE TABLE ewaste_category (
  category_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR2(80)  NOT NULL,
  description   VARCHAR2(300),
  hazard_level  VARCHAR2(10)  DEFAULT 'Low' NOT NULL,
  CONSTRAINT uq_category_name UNIQUE (name),
  CONSTRAINT ck_hazard CHECK (hazard_level IN ('Low','Medium','High'))
);

-- 3. COLLECTOR (profile data for users whose role = COLLECTOR) ----------------------
CREATE TABLE collector (
  collector_id  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       NUMBER NOT NULL,
  vehicle_no    VARCHAR2(20),
  area          VARCHAR2(80),
  available     NUMBER(1) DEFAULT 1 NOT NULL,
  CONSTRAINT uq_collector_user UNIQUE (user_id),
  CONSTRAINT fk_collector_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
  CONSTRAINT ck_collector_avail CHECK (available IN (0,1))
);

-- 4. RECYCLING FACILITY ---------------------------------------------------------------
CREATE TABLE recycling_facility (
  facility_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           VARCHAR2(120) NOT NULL,
  location       VARCHAR2(200) NOT NULL,
  capacity_kg    NUMBER(10)    NOT NULL,
  certification  VARCHAR2(100),
  CONSTRAINT ck_capacity CHECK (capacity_kg > 0)
);

-- 5. COLLECTION REQUEST (the e-waste submission and its collection in one row) -------
CREATE TABLE collection_request (
  request_id      NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         NUMBER NOT NULL,
  category_id     NUMBER NOT NULL,
  item_name       VARCHAR2(120) NOT NULL,
  quantity        NUMBER(5)     DEFAULT 1 NOT NULL,
  item_condition  VARCHAR2(10)  NOT NULL,
  pickup_address  VARCHAR2(300) NOT NULL,
  preferred_date  DATE          NOT NULL,
  status          VARCHAR2(12)  DEFAULT 'Pending' NOT NULL,
  collector_id    NUMBER,
  scheduled_date  DATE,
  collected_on    DATE,
  remarks         VARCHAR2(500),
  created_at      TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_req_user      FOREIGN KEY (user_id)      REFERENCES app_user(user_id),
  CONSTRAINT fk_req_category  FOREIGN KEY (category_id)  REFERENCES ewaste_category(category_id),
  CONSTRAINT fk_req_collector FOREIGN KEY (collector_id) REFERENCES collector(collector_id),
  CONSTRAINT ck_req_qty       CHECK (quantity > 0),
  CONSTRAINT ck_req_condition CHECK (item_condition IN ('Working','Damaged','Dead')),
  CONSTRAINT ck_req_status    CHECK (status IN ('Pending','Assigned','Collected','Processing','Recycled','Disposed'))
);
CREATE INDEX ix_req_user      ON collection_request(user_id);
CREATE INDEX ix_req_collector ON collection_request(collector_id);
CREATE INDEX ix_req_status    ON collection_request(status);

-- 6. STATUS HISTORY (timeline shown to the user) ---------------------------------------
CREATE TABLE status_history (
  history_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id   NUMBER NOT NULL,
  status       VARCHAR2(12) NOT NULL,
  changed_at   TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT fk_hist_req FOREIGN KEY (request_id) REFERENCES collection_request(request_id) ON DELETE CASCADE
);
CREATE INDEX ix_hist_req ON status_history(request_id);

-- 7. PROCESSING & RECYCLING RECORD -------------------------------------------------------
CREATE TABLE processing_record (
  record_id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id      NUMBER NOT NULL,
  facility_id     NUMBER NOT NULL,
  weight_kg       NUMBER(10,2) NOT NULL,
  process_status  VARCHAR2(12) DEFAULT 'In Progress' NOT NULL,
  final_status    VARCHAR2(10),
  processed_on    DATE,
  CONSTRAINT uq_proc_request  UNIQUE (request_id),
  CONSTRAINT fk_proc_request  FOREIGN KEY (request_id)  REFERENCES collection_request(request_id),
  CONSTRAINT fk_proc_facility FOREIGN KEY (facility_id) REFERENCES recycling_facility(facility_id),
  CONSTRAINT ck_proc_weight   CHECK (weight_kg > 0),
  CONSTRAINT ck_proc_status   CHECK (process_status IN ('In Progress','Completed')),
  CONSTRAINT ck_proc_final    CHECK (final_status IN ('Recycled','Disposed') OR final_status IS NULL)
);

-- ---------------------------------------------------------------------
-- Trigger: every status change on a request is logged to status_history
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_request_status_log
AFTER INSERT OR UPDATE OF status ON collection_request
FOR EACH ROW
BEGIN
  IF INSERTING OR :NEW.status <> :OLD.status THEN
    INSERT INTO status_history (request_id, status) VALUES (:NEW.request_id, :NEW.status);
  END IF;
END;
/

-- ---------------------------------------------------------------------
-- Report views
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_request_details AS
SELECT r.request_id, r.user_id, u.full_name AS user_name, r.category_id, c.name AS category_name,
       r.item_name, r.quantity, r.item_condition, r.pickup_address, r.preferred_date, r.status,
       r.collector_id, cu.full_name AS collector_name, r.scheduled_date, r.collected_on, r.remarks, r.created_at
FROM   collection_request r
JOIN   app_user u          ON u.user_id = r.user_id
JOIN   ewaste_category c   ON c.category_id = r.category_id
LEFT JOIN collector co     ON co.collector_id = r.collector_id
LEFT JOIN app_user cu      ON cu.user_id = co.user_id;

CREATE OR REPLACE VIEW v_status_summary AS
SELECT status, COUNT(*) AS request_count FROM collection_request GROUP BY status;

CREATE OR REPLACE VIEW v_category_summary AS
SELECT c.name AS category_name, NVL(SUM(r.quantity),0) AS total_units
FROM   ewaste_category c LEFT JOIN collection_request r ON r.category_id = c.category_id
GROUP  BY c.name;

CREATE OR REPLACE VIEW v_facility_load AS
SELECT f.facility_id, f.name, f.capacity_kg, NVL(SUM(p.weight_kg),0) AS processed_kg
FROM   recycling_facility f LEFT JOIN processing_record p ON p.facility_id = f.facility_id
GROUP  BY f.facility_id, f.name, f.capacity_kg;

COMMIT;
