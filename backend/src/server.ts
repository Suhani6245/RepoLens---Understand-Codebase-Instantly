import { createApp } from "./app";
import { env, validateEnv } from "./config/env";

validateEnv();

const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`RepoLens backend listening on port ${env.port} (${env.nodeEnv})`);
});
