"""
In-memory prediction cache keyed by SHA-256 of image bytes.
Avoids re-running the ResNet classifier for identical images uploaded twice.
LRU eviction at MAX_SIZE entries to prevent unbounded memory growth.
"""

import hashlib
from collections import OrderedDict
from typing import Any, Optional

MAX_SIZE = 512

_cache: OrderedDict[str, dict[str, Any]] = OrderedDict()


def _key(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()


def get(image_bytes: bytes) -> Optional[dict[str, Any]]:
    k = _key(image_bytes)
    if k not in _cache:
        return None
    _cache.move_to_end(k)
    return _cache[k]


def put(image_bytes: bytes, result: dict[str, Any]) -> None:
    k = _key(image_bytes)
    _cache[k] = result
    _cache.move_to_end(k)
    if len(_cache) > MAX_SIZE:
        _cache.popitem(last=False)


def size() -> int:
    return len(_cache)


def clear() -> None:
    _cache.clear()
