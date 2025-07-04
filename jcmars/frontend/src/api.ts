import axios from 'axios';
import { SearchQuery, SearchResponse, RegionsResponse, PositionsResponse } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2分タイムアウト
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchJCMembers = async (query: SearchQuery): Promise<SearchResponse> => {
  const response = await api.post<SearchResponse>('/api/v1/search', query);
  return response.data;
};

export const getRegions = async (): Promise<RegionsResponse> => {
  const response = await api.get<RegionsResponse>('/api/v1/regions');
  return response.data;
};

export const getPositions = async (): Promise<PositionsResponse> => {
  const response = await api.get<PositionsResponse>('/api/v1/positions');
  return response.data;
};