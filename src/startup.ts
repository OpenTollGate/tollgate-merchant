import { container } from 'tsyringe';
import pino from 'pino';
import {registerCommandHandler, registerEventHandler, registerQueryHandler} from "./cqrs/base/cqrs.ts";
import {CustomerPaymentEvent, RepoWatchRequestedEventHandler} from "./cqrs/events/CustomerPaymentEvent.ts";
import { RelayProvider } from './RelayProvider.ts';
import {EventListenerRegistry} from "./listeners/EventListenerRegistry.ts";
import {IEventListenerRegistry} from "./listeners/IEventListenerRegistry.ts";
import {nostrNow} from "./utils/nostrEventUtils.ts";
import {EventPublisher, IEventPublisher} from './publisher/EventPublisher.ts';
import IEventHandler from "./cqrs/base/IEventHandler.ts";

export async function startup() {
    const logger = pino.pino();
    logger.info("Running startup");

    container.registerInstance("Logger", logger);
    container.register(RelayProvider.name, { useClass: RelayProvider });
    container.register(EventPublisher.name, { useClass: EventPublisher });

    // CQRS registrations
    registerEventHandler(CustomerPaymentEvent.name, RepoWatchRequestedEventHandler);

    container.registerSingleton(EventListenerRegistry.name, EventListenerRegistry);

    logger.info("All services registered");

    setupListeners()

    logger.info("Startup completed");
}

function setupListeners() {
    const eventListenerRegistry: IEventListenerRegistry = container.resolve(EventListenerRegistry.name);
    var customerPaymentFilters = [
        {
            kinds: [55555],
            since: nostrNow()
        }
    ]

    const repoWatchRequestedEventHandler: IEventHandler<CustomerPaymentEvent> = container.resolve(CustomerPaymentEvent.name);
    eventListenerRegistry.add("customer-payments", customerPaymentFilters, repoWatchRequestedEventHandler)
}
