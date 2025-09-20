ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS build

RUN apk add --no-cache git

WORKDIR /usr/src/app
COPY . .
RUN npm install -g @nestjs/cli
RUN npm install -g @angular/cli
RUN cd server && npm install && nest build
RUN cd client && npm install && npm run build


FROM node:${NODE_VERSION}-alpine

COPY ca-certificates/* /usr/local/share/ca-certificates/
RUN apk upgrade --no-cache && \
    apk add --no-cache ca-certificates && \
    rm -rf /var/cache/apk/* && \
    update-ca-certificates

WORKDIR /usr/src/app
COPY --from=build /usr/src/app/server .
COPY --from=build /usr/src/app/client/dist/client/browser client

EXPOSE 5200

USER node
CMD ["npm", "run", "start:prod"]
