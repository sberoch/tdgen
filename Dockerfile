ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /usr/src/app
COPY server server
COPY client client
RUN npm install -g @angular/cli
RUN cd server && npm install
RUN cd client && npm install && ng build


FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app
COPY --from=build /usr/src/app/server .
COPY --from=build /usr/src/app/client/dist/client/browser client

EXPOSE 5200

CMD ["npm", "run", "serve"]
