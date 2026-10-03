#!/bin/bash
sudo apt update
sudo apt install docker.io
sudo newgrp docker
sudo usermod -aG docker $USER
docker run hello-world
docker login
docker login dhi.io
git clone https://github.com/mukul-329/Blog-WebApp-3Tier
cd Blog-WebApp-3Tier
cd backend
docker build -t blog-backend .
cd ../frontend
docker build -t blog-frontend .
cd ..
docker create network blog-network
docker network ls
docker run -d --name blog-db --network blog-network -v ./blog-db/db:/data/db/ -v ./blog-db/configdb:/data/configdb mongo

cd backend
docker run -d --name blog-bck --network blog-network --env-file .env blog-backend 

cd ../frontend
docker run -d --name blog-ui --network blog-network --env-file .env -p 3000:80 blog-frontend 

#Running via Docker compose
cd ..
docker stop $(docker ps -q)
docker compose up -d