import re
import string
from typing import List, Tuple, Dict, Any
from datetime import datetime, timezone, timedelta

def normalize_title(text: str) -> str:
    """Normalize title for fuzzy comparison: lowercases, strips punctuation, normalizes spaces."""
    if not text:
        return ""
    text = text.lower()
    # Remove punctuation
    text = text.translate(str.maketrans("", "", string.punctuation))
    # Normalize whitespaces
    text = re.sub(r"\s+", " ", text).strip()
    return text

def get_stemmed_tokens(text: str) -> set:
    words = normalize_title(text).split()
    tokens = set()
    for w in words:
        if len(w) > 3 and w.endswith("s"):
            tokens.add(w[:-1])
        tokens.add(w)
    return tokens

def calculate_jaccard_similarity(text1: str, text2: str) -> float:
    """Calculate token-level Jaccard similarity between two texts."""
    tokens1 = get_stemmed_tokens(text1)
    tokens2 = get_stemmed_tokens(text2)
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)

def detect_duplicates(
    candidate_title: str,
    candidate_url: str,
    existing_items: List[Dict[str, Any]],
    similarity_threshold: float = 0.55
) -> List[Dict[str, Any]]:
    """
    Evaluates a candidate news item against existing items.
    Returns matching duplicates or related coverage items.
    """
    matches = []
    norm_candidate = normalize_title(candidate_title)

    for item in existing_items:
        # 1. Exact canonical URL match
        if item.get("url") and item.get("url").strip() == candidate_url.strip():
            matches.append({
                "item_id": item.get("id"),
                "title": item.get("title"),
                "similarity": 1.0,
                "reason": "EXACT_URL_MATCH"
            })
            continue

        # 2. Normalized Title exact match
        item_title = item.get("title", "")
        norm_item = normalize_title(item_title)
        if norm_candidate == norm_item and len(norm_candidate) > 5:
            matches.append({
                "item_id": item.get("id"),
                "title": item_title,
                "similarity": 1.0,
                "reason": "EXACT_TITLE_MATCH"
            })
            continue

        # 3. Jaccard token similarity
        similarity = calculate_jaccard_similarity(candidate_title, item_title)
        if similarity >= similarity_threshold:
            matches.append({
                "item_id": item.get("id"),
                "title": item_title,
                "similarity": round(similarity, 3),
                "reason": "HIGH_TOPIC_SIMILARITY"
            })

    return sorted(matches, key=lambda x: x["similarity"], reverse=True)
