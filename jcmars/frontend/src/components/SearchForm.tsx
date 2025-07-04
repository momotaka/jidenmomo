import React, { useState, useEffect } from 'react';
import { SearchQuery, RegionsResponse, PositionsResponse } from '../types';
import { getRegions, getPositions } from '../api';

interface SearchFormProps {
  onSearch: (query: SearchQuery) => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [regionName, setRegionName] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [regions, setRegions] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [regionsData, positionsData] = await Promise.all([
          getRegions(),
          getPositions()
        ]);
        setRegions(regionsData.regions.地区協議会);
        
        // すべての役職を結合
        const allPositions = new Set<string>();
        Object.values(positionsData.positions).forEach(positionList => {
          positionList.forEach(pos => allPositions.add(pos));
        });
        setPositions(Array.from(allPositions).sort());
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionName || !position) {
      alert('地域名と役職を入力してください');
      return;
    }
    
    onSearch({
      year,
      region_name: regionName,
      position,
      keywords: keywords || undefined,
      min_confidence: 0.6,
      max_results: 20
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
            年度
          </label>
          <input
            type="number"
            id="year"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min="1990"
            max="2030"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jc-blue"
            required
          />
        </div>
        
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
            地域名
          </label>
          <input
            type="text"
            id="region"
            value={regionName}
            onChange={(e) => setRegionName(e.target.value)}
            list="region-list"
            placeholder="例: 新潟ブロック、関東地区協議会"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jc-blue"
            required
          />
          <datalist id="region-list">
            {regions.map((region) => (
              <option key={region} value={region} />
            ))}
          </datalist>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
            役職
          </label>
          <input
            type="text"
            id="position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            list="position-list"
            placeholder="例: 会長、理事長、委員長"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jc-blue"
            required
          />
          <datalist id="position-list">
            {positions.map((pos) => (
              <option key={pos} value={pos} />
            ))}
          </datalist>
        </div>
        
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
            追加キーワード（任意）
          </label>
          <input
            type="text"
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="例: 総務委員会"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jc-blue"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-jc-blue hover:bg-blue-800'
        }`}
      >
        {isLoading ? '検索中...' : '思い出す！'}
      </button>
    </form>
  );
};

export default SearchForm;