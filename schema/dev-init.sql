CREATE ROLE osm PASSWORD 'osm' LOGIN;
CREATE DATABASE osm OWNER osm;

-- Pre-create extensions as superuser so functions.sql doesn't fail
\c osm postgres
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS intarray;
CREATE EXTENSION IF NOT EXISTS hstore;