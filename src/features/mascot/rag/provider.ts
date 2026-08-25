export interface KnowledgeChunk {
  id: string;
  content: string;
  title?: string;
  sourceUrl?: string;
  score?: number;
}

export interface MascotKnowledgeRetriever {
  retrieve(input: {
    query: string;
    articleId?: string;
    limit?: number;
  }): Promise<KnowledgeChunk[]>;
}
