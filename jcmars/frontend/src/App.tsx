import React, { useState } from 'react';
import SearchForm from './components/SearchForm';
import CandidateCard from './components/CandidateCard';
import { SearchQuery, SearchResponse } from './types';
import { searchJCMembers } from './api';

function App() {
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: SearchQuery) => {
    setIsLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      const result = await searchJCMembers(query);
      setSearchResult(result);
    } catch (err) {
      setError('検索中にエラーが発生しました。もう一度お試しください。');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-jc-blue text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">JCMARS</h1>
          <p className="text-lg">JC役職者自動ランキングシステム</p>
          <p className="text-sm mt-2 text-blue-100">
            「役職は覚えているが名前が思い出せない」を解決します
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-jc-blue"></div>
            <p className="mt-4 text-gray-600">検索中です。しばらくお待ちください...</p>
            <p className="text-sm text-gray-500 mt-2">
              （10〜60秒程度かかる場合があります）
            </p>
          </div>
        )}

        {searchResult && !isLoading && (
          <div>
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">
                {searchResult.query.year - 1}〜{searchResult.query.year + 1}年の
                {searchResult.query.region_name} {searchResult.query.position}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">検索結果:</span>
                  <span className="font-medium ml-2">{searchResult.metadata.total_results}件</span>
                </div>
                <div>
                  <span className="text-gray-600">検索時間:</span>
                  <span className="font-medium ml-2">
                    {(searchResult.metadata.search_duration_ms / 1000).toFixed(1)}秒
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">確認サイト数:</span>
                  <span className="font-medium ml-2">{searchResult.metadata.sources_searched}件</span>
                </div>
                <div>
                  <span className="text-gray-600">キャッシュ:</span>
                  <span className="font-medium ml-2">
                    {searchResult.metadata.cached ? '使用' : '未使用'}
                  </span>
                </div>
              </div>
            </div>

            {searchResult.results.length === 0 ? (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                該当する候補者が見つかりませんでした。検索条件を変更してお試しください。
              </div>
            ) : (
              <div>
                {searchResult.results.map((candidate) => (
                  <CandidateCard key={`${candidate.name}-${candidate.rank}`} candidate={candidate} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            &copy; 2024 JC Member Auto-Ranking System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;