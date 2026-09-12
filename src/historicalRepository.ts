import { HistoricalChangeRecord } from "./retrieval.schema.js";
import repository from "../historical/history.json" with { type: "json" };

export const historicalRepository = repository as HistoricalChangeRecord[];
