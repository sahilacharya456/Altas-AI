from sklearn.feature_extraction.text import TfidfVectorizer


def build_tfidf(texts: list[str]) -> tuple[TfidfVectorizer, object]:
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    matrix = vectorizer.fit_transform(texts)
    return vectorizer, matrix
