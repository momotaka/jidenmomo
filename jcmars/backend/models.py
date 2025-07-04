from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class PositionLevel(str, Enum):
    NATIONAL = "national"
    DISTRICT = "district"
    BLOCK = "block"
    LOM = "lom"


@dataclass
class SearchQuery:
    year: int
    region_name: str
    position: str
    keywords: Optional[str] = None
    min_confidence: float = 0.6
    max_results: int = 20


@dataclass
class JCCandidate:
    name: str
    region_name: str
    organization_name: str
    position: str
    year: int
    confidence_score: float
    rank: int
    evidence_sources: List[str] = field(default_factory=list)
    context_snippets: List[str] = field(default_factory=list)
    full_title: str = ""
    verified: bool = False


@dataclass
class SearchResult:
    search_id: str
    query: SearchQuery
    results: List[JCCandidate]
    metadata: Dict[str, Any]


@dataclass
class SourceInfo:
    url: str
    title: str
    snippet: str
    domain: str
    fetched_at: datetime


POSITIONS = {
    "日本青年会議所": [
        "会頭", "副会頭", "専務理事", "常務理事", "運営専務",
        "会務担当副会長", "理事", "監事", "顧問",
        "委員長", "副委員長", "事務局長", "財政局長",
        "総括幹事", "会計幹事", "庶務幹事", "企画幹事",
        "広報幹事", "渉外幹事", "幹事", "副幹事",
        "委員", "事務局員", "事務局次長"
    ],
    "地区協議会": [
        "会長", "副会長", "専務理事", "常務理事", "運営専務",
        "会務担当副会長", "理事", "監事", "顧問",
        "委員長", "副委員長", "事務局長", "財政局長",
        "総括幹事", "会計幹事", "庶務幹事", "企画幹事",
        "幹事", "副幹事", "委員", "事務局員"
    ],
    "ブロック協議会": [
        "会長", "副会長", "理事長", "専務理事", "運営専務",
        "会務担当副会長", "理事", "監事",
        "委員長", "副委員長", "事務局長", "財政局長",
        "総括幹事", "会計幹事", "幹事", "副幹事",
        "委員", "事務局員"
    ],
    "LOM": [
        "理事長", "副理事長", "専務理事", "常務理事", "運営専務",
        "会務担当副会長", "理事", "監事", "顧問",
        "委員長", "副委員長", "事務局長", "財政局長",
        "総括幹事", "会計幹事", "庶務幹事", "企画幹事",
        "幹事", "副幹事", "委員", "事務局員"
    ]
}


REGIONS = {
    "地区協議会": [
        "北海道地区協議会",
        "東北地区協議会",
        "関東地区協議会",
        "北陸信越地区協議会",
        "東海地区協議会",
        "近畿地区協議会",
        "中国地区協議会",
        "四国地区協議会",
        "九州地区協議会",
        "沖縄地区協議会"
    ]
}