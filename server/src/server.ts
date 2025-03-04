import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pino from "pino-http";
import { connectToDatabase } from "./database";
import { employeeRouter } from "./employee.routes";

dotenv.config();

const { MONGODB_ADMINUSERNAME = "admin" } = process.env;
const { MONGODB_ADMINPASSWORD = "admin" } = process.env;
const { MONGODB_HOST = "127.0.0.1:27017" } = process.env;
const { MONGODB_SCHEME = "mongodb" } = process.env;
const { MONGODB_DB_NAME = "tdgen" } = process.env;
const { CLIENT_DIST_DIR = "client" } = process.env;
const { APP_HTTP_PORT = 5200 } = process.env;

const MONGODB_URI = `${MONGODB_SCHEME}://${MONGODB_ADMINUSERNAME}:${MONGODB_ADMINPASSWORD}@${MONGODB_HOST}`;

connectToDatabase(MONGODB_URI, MONGODB_DB_NAME)
  .then(() => {
    const app = express();
    app.use(cors());
    app.use(pino());

    // start the Express server
    app.use(express.static(CLIENT_DIST_DIR));
    app.use("/employees", employeeRouter);
    app.listen(APP_HTTP_PORT, () => {
      pino().logger.info(`Server running at http://localhost:${APP_HTTP_PORT} ...`);
    });
  })
  .catch((error) => console.error(error));
