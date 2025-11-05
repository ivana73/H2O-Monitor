# H2O-Monitor
A full-stack web app for visualizing and managing water network failures with real-time updates and role-based access.

start frontend npm run dev
Ctrl C to stop

npm i lucide-react

Docker 
docker compose up -d 
//from root

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
