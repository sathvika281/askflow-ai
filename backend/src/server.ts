import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { chatRouter } from "./routes/chat";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", chatRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`AskFlow AI backend listening on port ${env.PORT}`);
});
