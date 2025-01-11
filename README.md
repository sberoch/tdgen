# TDGen


## Introduction

Right now, this is just a slightly expanded version of [How To Use The MEAN Stack: Build A Web Application From Scratch | MongoDB](https://www.mongodb.com/resources/languages/mean-stack-tutorial).

## How to build and run

### Prerequisits

* Recent Version of MongoDB Community Server
* Recent version of Node.js
* Angular CLI

### MongoDB

Install and run a local mongodb server. If you enable authentication (highly recommended), then you have to add an admin-user user `admin` with password `admin`. If you want another user change `server/.env` accordingly.

### API Server

Start server:

```bash
cd server
npm install
npm run serve | npx pino-pretty -c
```


### Frontend

Start client devserver:

```bash
cd client
npm install
ng serve -o
```

If you don't have the Angular CLI (`ng`) already installed, you may use `npm install -g @angular/cli` to install it.

## How to build and run a cntainer image

### build

```bash
export TDGEN_VERSION="0.1"
export TDGEN_IMAGE_TAG="harbor-bpol.polizei.bund.de/test/tdgen:${TDGEN_VERSION}"
podman build \
     -t ${TDGEN_IMAGE_TAG} \
     .
```

### run

```bash
podman run \
    --name tdgen \
    --rm \
    -p 5200:5200 \
    -e MONGODB_ADMINUSERNAME="admin" \
    -e MONGODB_ADMINPASSWORD="T4hAVkP7LUjcDwGy" \
    -e MONGODB_SCHEME="mongodb+srv" \
    -e MONGODB_HOST="cluster0.o7jh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" \
    -e MONGODB_DB_NAME="tdgen" \
    -e CLIENT_DIST_DIR="client" \
    ${TDGEN_IMAGE_TAG}
```
