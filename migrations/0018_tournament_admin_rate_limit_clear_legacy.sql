-- Drop rows that may have been written when client_key held a raw IP (pre-pepper).
DELETE FROM tournament_admin_rate_limits;
