# TDGen

## How to build and run

### Prerequisites

- Recent version of Node.js
- Angular CLI

### API Server

Start server:

```bash
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

### Frontend

Start client devserver:

```bash
cd client
npm install
ng serve -o
```

If you don't have the NestJS CLI (`nest`) already installed, you may use `npm install -g @nestjs/cli` to install it.

If you don't have the Angular CLI (`ng`) already installed, you may use `npm install -g @angular/cli` to install it.

## Server Environment Variables

The following environment variables can be configured in `server/.env`:

### Application Configuration

- `CLIENT_DIST_DIR` - Path to the built Angular client files. If not set, `/usr/src/app/client` is used. If set, it must be a relative path.
- `APP_HTTP_PORT` - Port for the HTTP server (example: 5200)
- `DATABASE_URL` - SQLite database file path (example: "file:./dev.db")

### User Attributes

- `TDGEN_ADMIN_ATTR_NAME` - SAML attribute name for admin users (example: "admin")
- `TDGEN_USER_ATTR_NAME` - SAML attribute name for regular users (example: "user")

### SAML Authentication

- `SAML_CALLBACK_URL` - URL for SAML authentication callback (example: "https://localhost:5200/auth/saml/callback")
- `SAML_ISSUER` - SAML issuer identifier in the identity provider (example: "tdgen")
- `SAML_METADATA_URL` - SAML identity provider metadata URL (example: "http://localhost:18080/realms/saml-test/protocol/saml/descriptor")

### Security

- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_COOKIE_LIFETIME` - Lifetime of the JWT cookie. Examples: "1h", "15m", "1d"

### Pessimistic Locking

- `LOCK_DURATION_MS` - Lock timeout in milliseconds (default: 1800000 = 30 minutes)
- `LOCK_REFRESH_INTERVAL_MS` - Client-side heartbeat interval in milliseconds (default: 300000 = 5 minutes)

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
    --userns=keep-id:uid=1000,gid=1000 \
    ${TDGEN_IMAGE_TAG}
```
