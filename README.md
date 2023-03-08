# Dimbridge App

Referenced this for setting up: [Dev Article](https://dev.to/nagatodev/how-to-connect-flask-to-reactjs-1k8i)


## Docker

`docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`

## React frontend

### Getting started:

Dev Server:

`cd frontend`
`npm run start`

You can start the backend from the frontend folder:

`cd frontend`
`npm run start-backend`
`"http://localhost:3000"`

## Flask backend

There is a proxy in frontend/package.json for path for Flask server `"http://localhost:5000"`.
This means we can use relative paths to hit flask endpoints. (`"/profile"` instead of `"http://localhost:5000/profile"`).

We are using axios.js for making async requests on the frontend.

### Getting started:
`cd backend`
`source env/bin/activate`
`run flask`
OR
`env/bin/flask run`

You can see it:
`"http://localhost:5000"`



