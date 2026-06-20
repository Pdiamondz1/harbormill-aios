import type { Connector } from "./types.ts";
import { stripeConnector } from "./stripe.ts";

export const CONNECTORS: Record<string, Connector> = {
  stripe: stripeConnector,
};
