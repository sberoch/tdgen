# TDGen


## Introduction

Right now, this is just a slightly expanded version of [How To Use The MEAN Stack: Build A Web Application From Scratch | MongoDB](https://www.mongodb.com/resources/languages/mean-stack-tutorial).

## How to build and run

### Prerequisits

* Recent version of Node.js
* Angular CLI

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

## How to build and run a container image

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
mkdir -p storage
podman run \
    --name tdgen \
    --rm \
    -e DATABASE_URL="file:/storage/prod.db" \
    -p 5200:5200 \
    -v ./storage:/storage \
    ${TDGEN_IMAGE_TAG}
```
