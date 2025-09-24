import express from "express";
import cors from "cors";
import { router } from "./routes/v1";

const app = express();
app.use(cors());
app.use(express.json())

app.use("/api/v1", router)

app.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => {
  console.log(`HTTP server running on port ${process.env.PORT || 3000}`);
})
