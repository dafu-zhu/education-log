-- Rename the term_season enum value 'autumn' to 'fall' to match user preference.
-- Safe to run only once. Postgres 10+ supports renaming enum values in place.
alter type term_season rename value 'autumn' to 'fall';
