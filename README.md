# H2O-Monitor
A full-stack web app for visualizing and managing water network failures with real-time updates and role-based access.

start frontend npm run dev
Ctrl C to stop

change nomi to Geoapify

npm i lucide-react

Docker 
docker compose up -d 
//from root

koji god update hoces najbolje je ovakp
docker exec -it h2o_db psql -U h2o -d h2o -c "ALTER TABLE incident
   ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
   ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;
 "
 docker exec -it h2o_db psql -U h2o -d h2o -c "CREATE TABLE IF NOT EXISTS \"user\" (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);"

docker exec -it h2o_db psql -U h2o -d h2o -c 'CREATE TABLE IF NOT EXISTS reportedIncident (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    reportedDescription TEXT NOT NULL,
    reportedAddress TEXT NOT NULL
);'

docker exec -it h2o_db psql -U h2o -d h2o -c "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS city TEXT NOT NULL, ADD COLUMN IF NOT EXISTS areas TEXT, ADD COLUMN IF NOT EXISTS addressOfUser TEXT[];"

"
 docker exec -it h2o_db psql -U h2o -d h2o -c "SELECT *
            FROM reportedIncident
            ORDER BY id DESC
            LIMIT 500;"

docker exec -it h2o_db psql -U h2o -d h2o -c "delete FROM \"user\";"

cd backend
source .venv/bin/activate
python -m worker.scheduler

curl http://127.0.0.1:8000/incidents

source .venv/bin/activate
uvicorn api.main:app --reload --port 8000
pyenv shell 3.10.4


GIT
git add .
git commit -m "comm"
git push