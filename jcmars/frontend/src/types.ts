export interface SearchQuery {
  year: number;
  region_name: string;
  position: string;
  keywords?: string;
  min_confidence?: number;
  max_results?: number;
}

export interface JCCandidate {
  name: string;
  region_name: string;
  organization_name: string;
  position: string;
  year: number;
  confidence_score: number;
  rank: number;
  evidence_sources: string[];
  context_snippets: string[];
  full_title: string;
  verified: boolean;
}

export interface SearchResponse {
  search_id: string;
  query: SearchQuery;
  results: JCCandidate[];
  metadata: {
    total_results: number;
    search_duration_ms: number;
    sources_searched: number;
    target_years: number[];
    cached: boolean;
  };
}

export interface RegionsResponse {
  regions: {
    地区協議会: string[];
  };
}

export interface PositionsResponse {
  positions: {
    日本青年会議所: string[];
    地区協議会: string[];
    ブロック協議会: string[];
    LOM: string[];
  };
}