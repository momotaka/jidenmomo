from typing import Dict, Optional, Any
from datetime import datetime, timedelta
import hashlib
import json
from collections import OrderedDict


class LRUCache:
    """シンプルなLRUキャッシュ実装"""
    
    def __init__(self, max_size: int = 100, ttl_minutes: int = 60):
        self.cache: OrderedDict = OrderedDict()
        self.max_size = max_size
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def _make_key(self, query_dict: Dict) -> str:
        """クエリからキャッシュキーを生成"""
        sorted_query = json.dumps(query_dict, sort_keys=True, ensure_ascii=False)
        return hashlib.md5(sorted_query.encode()).hexdigest()
    
    def get(self, query_dict: Dict) -> Optional[Any]:
        """キャッシュから値を取得"""
        key = self._make_key(query_dict)
        
        if key in self.cache:
            entry = self.cache[key]
            if datetime.now() - entry['timestamp'] < self.ttl:
                # LRU: 最近使用したものを最後に移動
                self.cache.move_to_end(key)
                return entry['value']
            else:
                # 期限切れのエントリを削除
                del self.cache[key]
        
        return None
    
    def set(self, query_dict: Dict, value: Any):
        """キャッシュに値を設定"""
        key = self._make_key(query_dict)
        
        # 既存のエントリがあれば削除
        if key in self.cache:
            del self.cache[key]
        
        # 新しいエントリを追加
        self.cache[key] = {
            'value': value,
            'timestamp': datetime.now()
        }
        
        # サイズ制限を超えたら最も古いものを削除
        if len(self.cache) > self.max_size:
            self.cache.popitem(last=False)
    
    def clear(self):
        """キャッシュをクリア"""
        self.cache.clear()
    
    def size(self) -> int:
        """現在のキャッシュサイズを取得"""
        return len(self.cache)


# グローバルキャッシュインスタンス
search_cache = LRUCache(max_size=100, ttl_minutes=60)