import {container, inject, injectable} from "tsyringe";
import type pino from "pino";
import {NRelay, NSecSigner} from '@nostrify/nostrify';
import {RelayProvider} from "../RelayProvider.ts";
import type IRelayProvider from "../IRelayProvider.ts";
import {nostrNow} from "../utils/nostrEventUtils.ts";
import IEvent from "../cqrs/base/IEvent.ts";
import IEventHandler from "../cqrs/base/IEventHandler.ts";

export type EventTemplate = { kind: number; content?: string; tags: string[][]; }

export interface IEventPublisher {
    publish(event: EventTemplate): Promise<void>
    publishInternal(eventName: string, event: IEvent): Promise<void>
}


@injectable()
export class EventPublisher implements IEventPublisher {

    private relay: NRelay;
    private logger: pino.Logger;

    constructor(
        @inject("Logger") logger: pino.Logger,
        @inject(RelayProvider.name) relayProvider: IRelayProvider,
    ) {
        this.logger = logger;
        this.relay = relayProvider.getDefaultPool();

    }

    public async publish(event: EventTemplate): Promise<void> {
        const secretKey = Deno.env.get("TOLLGATE_MERCHANT_PRIVATEKEY")

        if(!secretKey){
            throw new Error("TOLLGATE_MERCHANT_PRIVATEKEY environment variable required");
        }

        const signer = new NSecSigner(secretKey);
        const signerPubkey = await signer.getPublicKey();

        var note = {
            kind: event.kind,
            pubkey: signerPubkey,
            content: event.content ?? "",
            created_at: nostrNow(),
            tags: event.tags
        }
        const envt = await signer.signEvent(note);

        await this.relay.event(envt)
    }

    public async publishInternal<TEvent extends IEvent>(eventName: string, event: TEvent): Promise<void> {
        const eventHandler: IEventHandler<TEvent> = container.resolve(eventName);

        // TODO: don't await, but place on a queue
        await eventHandler.execute(event);
    }
}