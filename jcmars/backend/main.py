from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import time
from datetime import datetime
import logging

from models import SearchQuery, SearchResult, JCCandidate, POSITIONS, REGIONS
from scraper import JCScraper
from ranking import CandidateRanker
from cache import search_cache


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="JC Member Auto-Ranking System",
    description="日本青年会議所役職者自動ランキングシステム",
    version="1.0.0"
)

# CORS設定
import os

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    year: int = Field(..., ge=1990, le=2030, description="検索対象年度")
    region_name: str = Field(..., min_length=1, description="地域名")
    position: str = Field(..., min_length=1, description="役職名")
    keywords: Optional[str] = Field(None, description="追加キーワード")
    min_confidence: float = Field(0.6, ge=0.0, le=1.0, description="最低信頼度")
    max_results: int = Field(20, ge=1, le=50, description="最大結果数")


class SearchResponse(BaseModel):
    search_id: str
    query: SearchRequest
    results: List[JCCandidate]
    metadata: dict


@app.get("/")
async def root():
    return {"message": "JC Member Auto-Ranking System API", "version": "1.0.0"}


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cache_size": search_cache.size()
    }


@app.get("/api/v1/regions")
async def get_regions():
    """地域一覧を取得"""
    return {"regions": REGIONS}


@app.get("/api/v1/positions")
async def get_positions():
    """役職一覧を取得"""
    return {"positions": POSITIONS}


@app.post("/api/v1/search", response_model=SearchResponse)
async def search_jc_members(request: SearchRequest):
    """JC役職者を検索"""
    start_time = time.time()
    
    # キャッシュチェック
    cache_key = {
        "year": request.year,
        "region_name": request.region_name,
        "position": request.position,
        "keywords": request.keywords
    }
    
    cached_result = search_cache.get(cache_key)
    if cached_result:
        logger.info("Cache hit for search query")
        return cached_result
    
    # 検索クエリを作成
    query = SearchQuery(
        year=request.year,
        region_name=request.region_name,
        position=request.position,
        keywords=request.keywords,
        min_confidence=request.min_confidence,
        max_results=request.max_results
    )
    
    try:
        # スクレイピング実行
        async with JCScraper() as scraper:
            candidates = await scraper.scrape(query)
        
        # ランキング処理
        ranker = CandidateRanker()
        ranked_candidates = ranker.rank_candidates(candidates, query)
        
        # 検索対象年度範囲
        target_years = [query.year - 1, query.year, query.year + 1]
        
        # レスポンス作成
        response = SearchResponse(
            search_id=str(uuid.uuid4()),
            query=request,
            results=ranked_candidates,
            metadata={
                "total_results": len(ranked_candidates),
                "search_duration_ms": int((time.time() - start_time) * 1000),
                "sources_searched": len(set(sum([c.evidence_sources for c in candidates], []))),
                "target_years": target_years,
                "cached": False
            }
        )
        
        # キャッシュに保存
        search_cache.set(cache_key, response)
        
        return response
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"検索中にエラーが発生しました: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)