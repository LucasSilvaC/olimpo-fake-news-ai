export interface RedisPinData {
  roomId: string;
  status: string;
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
}

export interface IRedisRoomRepository {
  setRoomPin(pin: string, roomId: string, status: string): Promise<void>;
  getRoomByPin(pin: string): Promise<RedisPinData | null>;
  removeRoomPin(pin: string): Promise<void>;
  updateRoomStatus(pin: string, status: string): Promise<void>;
  setParticipantCount(roomId: string, count: number): Promise<void>;
  getParticipantCount(roomId: string): Promise<number>;
  incrementParticipantCount(roomId: string): Promise<number>;
  addMemberToLeaderboard(roomId: string, userId: string, score: number): Promise<void>;
  getLeaderboard(roomId: string): Promise<LeaderboardEntry[]>;
}
