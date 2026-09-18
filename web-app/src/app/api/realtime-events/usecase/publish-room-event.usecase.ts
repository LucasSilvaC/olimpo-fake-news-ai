import { RoomEvent, RoomEventType } from "../entities";
import { IEventPublisher } from "../repositories/event-publisher.interface";
import { redisEventPublisher } from "../repositories/redis-event.publisher";

export interface PublishRoomEventInput<T = unknown> {
  pin: string;
  roomId: string;
  type: RoomEventType;
  payload: T;
}

export class PublishRoomEventUseCase {
  constructor(private readonly eventPublisher: IEventPublisher = redisEventPublisher) {}

  async execute<T = unknown>(input: PublishRoomEventInput<T>): Promise<RoomEvent<T>> {
    const event: RoomEvent<T> = {
      type: input.type,
      roomId: input.roomId,
      pin: input.pin,
      payload: input.payload,
      timestamp: new Date().toISOString(),
    };

    await this.eventPublisher.publish(input.pin, event);
    return event;
  }
}

export const publishRoomEventUseCase = new PublishRoomEventUseCase();
