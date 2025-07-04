import asyncio
import re
from typing import List, Dict, Set, Optional
from datetime import datetime
import aiohttp
from bs4 import BeautifulSoup
try:
    from googlesearch import search
except ImportError:
    # googlesearch-pythonパッケージの場合
    from googlesearch_python import search
import logging

from models import JCCandidate, SearchQuery, SourceInfo
from utils import (
    normalize_person_name,
    is_jc_official_site,
    extract_domain,
    EXTRACTION_PATTERNS
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JCScraper:
    def __init__(self):
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.access_interval = 1.5
        self.timeout = aiohttp.ClientTimeout(total=10)
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers=self.headers, timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def build_search_query(self, query: SearchQuery) -> str:
        """検索クエリを構築"""
        search_terms = []
        
        search_terms.append(f'"{query.year}年" OR "{query.year}年度"')
        search_terms.append(f'"{query.region_name}"')
        search_terms.append(f'"{query.position}"')
        
        if "ブロック" in query.region_name:
            search_terms.append('"ブロック協議会"')
        elif "地区" in query.region_name:
            search_terms.append('"地区協議会"')
        
        search_terms.append('"青年会議所" OR "JC"')
        
        if query.keywords:
            search_terms.append(query.keywords)
        
        return ' '.join(search_terms)
    
    async def search_google(self, query: SearchQuery) -> List[str]:
        """Google検索でURLを取得"""
        search_query = self.build_search_query(query)
        urls = []
        
        try:
            for url in search(search_query, num_results=20, lang='ja'):
                urls.append(url)
                if len(urls) >= 20:
                    break
        except Exception as e:
            logger.error(f"Google search error: {e}")
        
        return urls
    
    async def fetch_page(self, url: str) -> Optional[str]:
        """ページの内容を取得"""
        try:
            await asyncio.sleep(self.access_interval)
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.text()
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
        return None
    
    def extract_candidates(self, html: str, source_info: SourceInfo, query: SearchQuery) -> List[Dict]:
        """HTMLから候補者情報を抽出"""
        if not html:
            return []
        
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text()
        if not text:
            return []
        
        text = re.sub(r'\s+', ' ', text)
        
        candidates = []
        found_names = set()
        
        for pattern in EXTRACTION_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            
            for match in matches:
                data = match.groupdict()
                
                name = data.get('name', '')
                if not name or len(name) < 2 or len(name) > 8:
                    continue
                
                name = normalize_person_name(name)
                
                if name in found_names:
                    continue
                
                position = data.get('position', query.position)
                year = int(data.get('year', query.year))
                region = data.get('region', query.region_name)
                
                if abs(year - query.year) > 1:
                    continue
                
                context = text[max(0, match.start() - 50):min(len(text), match.end() + 50)]
                
                candidates.append({
                    'name': name,
                    'position': position,
                    'year': year,
                    'region_name': region,
                    'organization_name': region,
                    'source_url': source_info.url,
                    'context': context.strip()
                })
                
                found_names.add(name)
        
        return candidates
    
    async def scrape(self, query: SearchQuery) -> List[JCCandidate]:
        """メインのスクレイピング処理"""
        urls = await self.search_google(query)
        all_candidates = {}
        
        for i, url in enumerate(urls[:20]):
            logger.info(f"Scraping {i+1}/{min(20, len(urls))}: {url}")
            
            html = await self.fetch_page(url)
            if not html:
                continue
            
            source_info = SourceInfo(
                url=url,
                title="",
                snippet="",
                domain=extract_domain(url),
                fetched_at=datetime.now()
            )
            
            candidates = self.extract_candidates(html, source_info, query)
            
            for candidate in candidates:
                name = candidate['name']
                if name not in all_candidates:
                    all_candidates[name] = {
                        'name': name,
                        'position': candidate['position'],
                        'year': candidate['year'],
                        'region_name': candidate['region_name'],
                        'organization_name': candidate['organization_name'],
                        'sources': [],
                        'contexts': []
                    }
                
                all_candidates[name]['sources'].append(candidate['source_url'])
                all_candidates[name]['contexts'].append(candidate['context'])
        
        jc_candidates = []
        for name, data in all_candidates.items():
            jc_candidates.append(JCCandidate(
                name=data['name'],
                region_name=data['region_name'],
                organization_name=data['organization_name'],
                position=data['position'],
                year=data['year'],
                confidence_score=0.0,
                rank=0,
                evidence_sources=data['sources'],
                context_snippets=data['contexts']
            ))
        
        return jc_candidates