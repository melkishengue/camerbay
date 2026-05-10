# Camerbay app

## Run

### Create configuration file

```bash
cp src/main/resources/application-andre.properties src/main/resources/application.properties 
```

### Activate postgis extension on database
If not yet done, activate the postgis extension on the database by running:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Then launch the app and open the following url: http://localhost:8082

## Create new user with admin rights on database

```sql
-- Create the user
CREATE USER user WITH PASSWORD 'password';

-- Grant database-level privileges
GRANT ALL PRIVILEGES ON DATABASE camerbay_andre TO user;

-- Grant schema and object privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO user;
GRANT ALL PRIVILEGES ON SCHEMA public TO user;

-- For future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON TABLES TO user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL PRIVILEGES ON SEQUENCES TO user;
```