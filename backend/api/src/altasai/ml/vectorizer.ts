export interface VectorizerModel {
  vocabulary: string[];
  documentFrequency: Record<string, number>;
  documentCount: number;
}

export const tokenizeForModel = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);

export const trainVectorizer = (documents: string[]): VectorizerModel => {
  const documentFrequency: Record<string, number> = {};
  for (const document of documents) {
    for (const token of new Set(tokenizeForModel(document))) {
      documentFrequency[token] = (documentFrequency[token] ?? 0) + 1;
    }
  }
  return {
    vocabulary: Object.keys(documentFrequency).sort(),
    documentFrequency,
    documentCount: documents.length,
  };
};

export const tfidfVector = (model: VectorizerModel, text: string): Record<string, number> => {
  const tokens = tokenizeForModel(text);
  const counts = tokens.reduce<Record<string, number>>((acc, token) => {
    if (model.documentFrequency[token]) acc[token] = (acc[token] ?? 0) + 1;
    return acc;
  }, {});
  const total = Math.max(1, tokens.length);
  const vector: Record<string, number> = {};
  for (const [token, count] of Object.entries(counts)) {
    const tf = count / total;
    const idf = Math.log((1 + model.documentCount) / (1 + model.documentFrequency[token])) + 1;
    vector[token] = tf * idf;
  }
  return vector;
};
