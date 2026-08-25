export type MascotMemoryKind =
  | "nickname"
  | "interest"
  | "preference"
  | "learning_topic";

export interface MascotMemory {
  id: string;
  kind: MascotMemoryKind;
  value: string;
  createdAt?: Date;
}

export interface MascotMemoryProvider {
  getMemories(visitorId: string): Promise<MascotMemory[]>;
  saveMemory(
    visitorId: string,
    memory: Pick<MascotMemory, "kind" | "value">,
  ): Promise<void>;
  clearMemories(visitorId: string): Promise<void>;
}
