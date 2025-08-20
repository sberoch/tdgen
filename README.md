# TDGen

## Introduction

Right now, this is just a slightly expanded version of [How To Use The MEAN Stack: Build A Web Application From Scratch | MongoDB](https://www.mongodb.com/resources/languages/mean-stack-tutorial).

## How to build and run

### Prerequisits

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
- `SAML_ENTRY_POINT` - SAML identity provider entry point URL (example: "http://localhost:18080/realms/saml-test/protocol/saml")
- `SAML_ISSUER` - SAML issuer identifier in the identity provider (example: "tdgen")
- `SAML_CERT` - SAML certificate for validating responses. This value is WITHOUT the `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----` lines (example: "MIICoTC..")

### Security

- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_COOKIE_LIFETIME` - Lifetime of the JWT cookie. Examples: "1h", "15m", "1d"

## SAML Metadata Fetcher

The server includes a script to fetch SAML identity provider metadata from any SAML 2.0 compliant IdP (Keycloak, ADFS, Azure AD, Okta, etc.).

### Usage

```bash
cd server
npm run generate-saml-metadata
```

### Environment Variables

The script uses the following environment variables:

- `SAML_ENTRY_POINT` - (Primary) SAML IdP entry point URL. The script will automatically construct metadata URLs for common IdP patterns
- `SAML_METADATA_URL` - (Optional) Direct metadata endpoint URL if you want to bypass auto-detection

### Features

- **IdP Agnostic**: Works with any SAML 2.0 compliant identity provider
- **Smart URL Detection**: Automatically constructs metadata URLs from entry points for:
  - Keycloak: `/protocol/saml` → `/protocol/saml/descriptor`
  - ADFS: `/adfs/services/trust` → `/federationmetadata/2007-06/federationmetadata.xml`
  - Azure AD: Auto-detects tenant and constructs proper metadata URL
  - Okta: `/app/metadata`
- **XML File Output**: Saves metadata to `/server/scripts/saml-metadata-{timestamp}.xml`
- **Configuration Export**: Provides passport-saml compatible configuration

### Example Output

The script will:

1. Fetch the metadata XML from your IdP
2. Save it to a timestamped file in the scripts folder
3. Parse and display key information (Entity ID, SSO URL, Certificate, etc.)
4. Generate a passport-saml compatible configuration object

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
