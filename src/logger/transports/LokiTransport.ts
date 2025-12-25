import LokiTransport from "winston-loki";

export default new LokiTransport({
  labels: { service: "node-postgresql" },
  host: "http://loki:3100",
});
