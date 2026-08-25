import { NoopMascotMemoryProvider } from "../memory";
import { NoopMascotKnowledgeRetriever } from "../rag";

export function createMascotServerDependencies() {
  return {
    memory: new NoopMascotMemoryProvider(),
    knowledge: new NoopMascotKnowledgeRetriever(),
  };
}
