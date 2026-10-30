create table library_entries (
    id          bigint generated always as identity primary key,
    user_id     uuid         not null,
    media_type  varchar(10)  not null check (media_type in ('MANGA', 'ANIME')),
    mal_id      integer      not null,
    title       varchar(500) not null,
    image_url   varchar(1000),
    status      varchar(20)  not null check (status in ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'DROPPED')),
    rating      integer check (rating between 1 and 10),
    progress    integer check (progress >= 0),
    favorite    boolean      not null default false,
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now(),
    constraint library_entries_user_title_uk unique (user_id, media_type, mal_id)
);

create index library_entries_user_updated_idx on library_entries (user_id, updated_at desc);

-- Only the Spring API reads this table. On Supabase, enabling RLS with no policies keeps it out of
-- the auto-generated public REST API (anon/authenticated roles get nothing).
alter table library_entries enable row level security;

-- On Supabase, tie entries to auth.users so deleting an account removes its library.
-- Skipped on a plain Postgres (local docker, tests) where the auth schema does not exist.
do $$
begin
    if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
        alter table library_entries
            add constraint library_entries_user_fk foreign key (user_id) references auth.users (id) on delete cascade;
    end if;
end
$$;
