import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pino from "pino-http";
import { employeeRouter } from "./employee.routes";

dotenv.config();

const { CLIENT_DIST_DIR = "client" } = process.env;
const { APP_HTTP_PORT = 5200 } = process.env;

const app = express();
app.use(cors());
app.use(pino());
app.use(express.static(CLIENT_DIST_DIR));
app.use("/employees", employeeRouter);
app.listen(APP_HTTP_PORT, () => {
  pino().logger.info(`Server running at http://localhost:${APP_HTTP_PORT} ...`);
});
