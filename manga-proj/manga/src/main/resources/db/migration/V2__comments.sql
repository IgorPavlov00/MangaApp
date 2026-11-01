create table comments (
    id           bigint generated always as identity primary key,
    user_id      uuid          not null,
    author_name  varchar(100)  not null,
    media_type   varchar(10)   not null check (media_type in ('MANGA', 'ANIME')),
    mal_id       integer       not null,
    body         varchar(4000) not null check (length(trim(body)) > 0),
    spoiler      boolean       not null default false,
    created_at   timestamptz   not null default now(),
    updated_at   timestamptz   not null default now()
);

create index comments_title_created_idx on comments (media_type, mal_id, created_at desc);
create index comments_user_idx on comments (user_id);

-- Same as library_entries: only the Spring API reads this table, keep it out of Supabase's REST API.
alter table comments enable row level security;

do $$
begin
    if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
        alter table comments
            add constraint comments_user_fk foreign key (user_id) references auth.users (id) on delete cascade;
    end if;
end
$$;
