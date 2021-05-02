export const PREPARE = `

CREATE TABLE IF NOT EXISTS spaces (
  sid INTEGER PRIMARY KEY,
  space TEXT NOT NULL,
  UNIQUE(space)
);

CREATE TABLE IF NOT EXISTS tags (
  tid INTEGER PRIMARY KEY,
  tag TEXT NOT NULL,
  UNIQUE(tag)
);

CREATE TABLE IF NOT EXISTS routes (
  rid INTEGER PRIMARY KEY,
  route TEXT NOT NULL,
  path TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(route)
);

CREATE TABLE IF NOT EXISTS cache (
  sid INTEGER NOT NULL,
  tid INTEGER NOT NULL,
  rid INTEGER NOT NULL,
  FOREIGN KEY(sid) REFERENCES spaces(sid),
  FOREIGN KEY(tid) REFERENCES tags(tid),
  FOREIGN KEY(rid) REFERENCES routes(rid),
  UNIQUE(sid, tid, rid)
);

CREATE INDEX IF NOT EXISTS index_space ON cache(sid);
CREATE INDEX IF NOT EXISTS index_space_tag ON cache(sid, tid);

`
