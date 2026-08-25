import type { MascotKnowledgeRetriever } from "./provider";

export class NoopMascotKnowledgeRetriever implements MascotKnowledgeRetriever {
  async retrieve(input: Parameters<MascotKnowledgeRetriever["retrieve"]>[0]) {
    void input;
    return [];
  }
}
