import { ExpectedError } from "../../../error";
import { Logger, createLogger } from "../../../lib/logger";
import { OrderFullyRefundedPayload } from "../../../pages/api/webhooks/order-fully-refunded";
import { WebhookAdapter } from "../../taxes/tax-webhook-adapter";
import { AvataxClient } from "../avatax-client";
import { AvataxConfig } from "../avatax-connection-schema";
import { AvataxOrderRefundedPayloadTransformer } from "./avatax-order-fully-refunded-payload-transformer";

export class AvataxOrderFullyRefundedAdapter
  implements WebhookAdapter<OrderFullyRefundedPayload, void>
{
  private logger: Logger;

  constructor(private readonly config: AvataxConfig) {
    this.logger = createLogger({ name: "AvataxOrderFullyRefundedAdapter" });
  }

  async send(payload: OrderFullyRefundedPayload) {
    this.logger.debug(
      { payload },
      "Transforming the Saleor payload for refunding order with AvaTax...",
    );

    // todo: document
    if (!this.config.isAutocommit) {
      throw new ExpectedError(
        "Unable to refund transaction. AvaTax can only refund committed transactions.",
      );
    }

    const client = new AvataxClient(this.config);
    const payloadTransformer = new AvataxOrderRefundedPayloadTransformer();
    const target = payloadTransformer.transform(payload, this.config);

    this.logger.debug(
      {
        target,
      },
      `Refunding the transaction...`,
    );

    const response = await client.fullyRefundTransaction(target);

    this.logger.debug({ response }, `Successfully refunded the transaction`);
  }
}
