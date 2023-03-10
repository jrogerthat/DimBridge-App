# Dimbridge App

## If using docker to run it:

docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

Its possible you'll need sudo depending on how you've installed Docker. Additionally, I think newer versions of docker lost the hyphen in the actual command, so it might be something along the lines of:

docker compose -f docker-compose.yml -f docker-compose.dev.yml up

## Non Docker

Referenced this for setting up: [Dev Article](https://dev.to/nagatodev/how-to-connect-flask-to-reactjs-1k8i)

### React frontend

#### Getting started:

Dev Server:

`cd frontend/app`
`npm run start`

### Flask backend

#### Getting started:
`cd backend/app`
`run flask`

You can see it:
`"http://localhost:5000"`



