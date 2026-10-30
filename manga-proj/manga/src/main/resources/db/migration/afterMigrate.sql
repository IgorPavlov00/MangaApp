-- Flyway callback (runs after every migrate). Supabase exposes every table in "public" through its
-- auto-generated REST API, so take Flyway's history table away from the public API roles.
-- REVOKE avoids the exclusive lock that ALTER TABLE would need while Flyway still holds the table.
do $$
begin
    if exists (select 1 from pg_roles where rolname = 'anon') then
        revoke all on table flyway_schema_history from anon, authenticated;
    end if;
end
$$;
