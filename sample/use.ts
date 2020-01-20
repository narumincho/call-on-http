import * as out from "./out";
import * as express from "express";
import * as http from "http";

const portNumber = 8932;
const path = "/";

const app = express();

app.use(express.raw());
app.use(path, out.middleware);
app.listen(portNumber, () => {
  console.log("listen http://localhost:" + portNumber.toString());
});
