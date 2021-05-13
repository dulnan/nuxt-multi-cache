export const PREPARE = `

CREATE TABLE IF NOT EXISTS page_cache (
  route TEXT,
  tag TEXT,
  UNIQUE(route, tag) ON CONFLICT IGNORE
);

CREATE TABLE IF NOT EXISTS cache_groups (
  name TEXT,
  tag TEXT,
  UNIQUE(name, tag) ON CONFLICT IGNORE
);

CREATE INDEX IF NOT EXISTS index_space ON page_cache(tag);
`
