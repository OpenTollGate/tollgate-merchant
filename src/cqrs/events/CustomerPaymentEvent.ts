import type pino from "pino";
import {inject, injectable} from "tsyringe";
import IEventHandler from '../base/IEventHandler.ts';
import IEvent from '../base/IEvent.ts';
import {NostrEvent} from '@nostrify/nostrify';
import {getTag, nostrNow} from "../../utils/nostrEventUtils.ts";
import {EventPublisher, EventTemplate, type IEventPublisher} from "../../publisher/EventPublisher.ts";

export class CustomerPaymentEvent implements IEvent {
    nostrEvent!: NostrEvent;
}



@injectable()
export class RepoWatchRequestedEventHandler implements IEventHandler<CustomerPaymentEvent> {
    private publisher: IEventPublisher;

    constructor(
        @inject("Logger") private logger: pino.Logger,
        @inject(EventPublisher.name) publisher: IEventPublisher,
    ) {
        this.publisher = publisher;
    }

    async execute(event: CustomerPaymentEvent): Promise<void> {
        try {
            const customerPubKey = event.nostrEvent.pubkey;
            const payment = event.nostrEvent.content;

            const purchasedTimeSeconds = 60;
            const sessionEndUnix = nostrNow() + purchasedTimeSeconds

            const macAddress = getMacAddress(event.nostrEvent)
            const valvePubkey = getValvePubkey();

            this.logger.info(`Customer ${customerPubKey} purchased ${purchasedTimeSeconds / 60} min of access. Authenticating...`);

            const note: EventTemplate = {
                kind: 66666,
                tags: [
                    ["p", valvePubkey],
                    ["mac", macAddress],
                    ["session-end", `${sessionEndUnix}`],
                ],
            };

            await this.publisher.publish(note);

        } catch (e){
            console.log(e)
            this.logger.error("error when processing customer payment.")
        }
    }
}

function getMacAddress(nostrEvent: NostrEvent) {
    const macAddress = getTag(nostrEvent, 'mac')?.[1]

    if(!macAddress){
        throw new Error("Event contained no mac address");
    }

    return macAddress;
}

function getValvePubkey() {
    const valvePubkey = Deno.env.get("TOLLGATE_VALVE_PUBKEY")

    if(!valvePubkey){
        throw new Error("VALVE_PUBKEY environment variable required");
    }

    return valvePubkey;
}