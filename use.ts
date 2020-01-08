import * as out from "./out";
import * as express from "express";

const app = express();

app.use("/", out.middleware);
const portNumber = 8932;
app.listen(portNumber, () => {
  console.log("listen http://localhost:" + portNumber.toString());
});
