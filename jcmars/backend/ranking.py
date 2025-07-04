from typing import List
from models import JCCandidate, SearchQuery
from utils import is_jc_official_site


class ConfidenceCalculator:
    """信頼度計算クラス"""
    
    def calculate_confidence(self, candidate: JCCandidate) -> float:
        """候補者の信頼度スコアを計算"""
        score = 0.0
        
        # 1. ソース信頼性 (50%)
        source_score = self._calculate_source_score(candidate.evidence_sources)
        score += source_score * 0.5
        
        # 2. 情報完全性 (30%)
        completeness_score = self._calculate_completeness_score(candidate)
        score += completeness_score * 0.3
        
        # 3. 複数ソース確認 (20%)
        multiple_source_score = self._calculate_multiple_source_score(candidate.evidence_sources)
        score += multiple_source_score * 0.2
        
        return min(1.0, score)
    
    def _calculate_source_score(self, sources: List[str]) -> float:
        """ソースの信頼性スコアを計算"""
        if not sources:
            return 0.0
        
        max_score = 0.0
        for source in sources:
            source_lower = source.lower()
            
            if 'jaycee.or.jp' in source_lower:
                max_score = max(max_score, 1.0)  # 日本JC公式サイト
            elif is_jc_official_site(source):
                max_score = max(max_score, 0.8)  # 各地域JC公式サイト
            elif any(domain in source_lower for domain in ['.go.jp', '.lg.jp']):
                max_score = max(max_score, 0.7)  # 公的機関
            elif 'wikipedia' in source_lower:
                max_score = max(max_score, 0.5)  # Wikipedia
            elif 'facebook.com' in source_lower or 'twitter.com' in source_lower:
                max_score = max(max_score, 0.4)  # SNS
            else:
                max_score = max(max_score, 0.3)  # その他サイト
        
        return max_score
    
    def _calculate_completeness_score(self, candidate: JCCandidate) -> float:
        """情報の完全性スコアを計算"""
        score = 0.0
        
        # 年度情報
        if candidate.year and 1990 <= candidate.year <= 2030:
            score += 0.33
        
        # 地域情報
        if candidate.region_name:
            score += 0.33
        
        # 役職情報
        if candidate.position:
            score += 0.34
        
        return score
    
    def _calculate_multiple_source_score(self, sources: List[str]) -> float:
        """複数ソース確認スコアを計算"""
        source_count = len(set(sources))  # 重複を除いたソース数
        
        if source_count >= 5:
            return 1.0
        elif source_count >= 3:
            return 0.8
        elif source_count >= 2:
            return 0.6
        elif source_count >= 1:
            return 0.3
        else:
            return 0.0


class CandidateRanker:
    """候補者ランキングクラス"""
    
    def __init__(self):
        self.confidence_calculator = ConfidenceCalculator()
    
    def rank_candidates(self, candidates: List[JCCandidate], query: SearchQuery) -> List[JCCandidate]:
        """候補者をランキング"""
        # 信頼度スコアを計算
        for candidate in candidates:
            candidate.confidence_score = self.confidence_calculator.calculate_confidence(candidate)
        
        # 最低信頼度でフィルタリング
        filtered_candidates = [
            c for c in candidates 
            if c.confidence_score >= query.min_confidence
        ]
        
        # スコアでソート（降順）
        sorted_candidates = sorted(
            filtered_candidates,
            key=lambda c: (c.confidence_score, len(c.evidence_sources)),
            reverse=True
        )
        
        # ランク付け
        for i, candidate in enumerate(sorted_candidates):
            candidate.rank = i + 1
        
        # 最大結果数で制限
        return sorted_candidates[:query.max_results]