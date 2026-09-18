import { RoomEvent } from "../entities";

export interface IEventPublisher {
  publish<T = unknown>(pin: string, event: RoomEvent<T>): Promise<number>;
}
