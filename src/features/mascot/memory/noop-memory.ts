import type { MascotMemoryProvider } from "./provider";

export class NoopMascotMemoryProvider implements MascotMemoryProvider {
  async getMemories(visitorId: string) {
    void visitorId;
    return [];
  }

  async saveMemory(
    visitorId: string,
    memory: Parameters<MascotMemoryProvider["saveMemory"]>[1],
  ) {
    void visitorId;
    void memory;
    // 注入经用户主动授权的 Provider 前，不启用长期记忆。
  }

  async clearMemories(visitorId: string) {
    void visitorId;
    // 空实现不会保存任何持久化状态。
  }
}
