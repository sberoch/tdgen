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

```
cd server
npm install
npx ts-node src/server.ts
```


### Frontend

Start client devserver:

```
cd client
npm install
ng serve -o
```

If you don't have the Angular CLI (`ng`) already installed, you may use `npm install -g @angular/cli` to install it.