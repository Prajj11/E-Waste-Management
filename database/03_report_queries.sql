-- Useful report queries for the DBMS lab demo / viva

-- 1. Requests by status
SELECT * FROM v_status_summary ORDER BY request_count DESC;

-- 2. Units collected per category
SELECT * FROM v_category_summary ORDER BY total_units DESC;

-- 3. Pending requests that still need a collector
SELECT request_id, user_name, item_name, category_name, preferred_date
FROM   v_request_details WHERE status = 'Pending' AND collector_id IS NULL ORDER BY preferred_date;

-- 4. Workload per collector
SELECT cu.full_name AS collector, COUNT(r.request_id) AS active_jobs
FROM   collector co
JOIN   app_user cu ON cu.user_id = co.user_id
LEFT JOIN collection_request r ON r.collector_id = co.collector_id AND r.status IN ('Assigned','Collected')
GROUP  BY cu.full_name;

-- 5. Recycling rate (kg)
SELECT ROUND(100 * SUM(CASE WHEN final_status = 'Recycled' THEN weight_kg END) / NULLIF(SUM(weight_kg),0), 1) AS recycling_rate_pct
FROM   processing_record WHERE final_status IS NOT NULL;

-- 6. Facility utilisation
SELECT name, processed_kg, capacity_kg, ROUND(100 * processed_kg / capacity_kg, 1) AS utilisation_pct FROM v_facility_load;

-- 7. Requests per month
SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS requests
FROM   collection_request GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY 1;
