import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from '../../lib/api/dashboardService';

// Mock global fetch
global.fetch = vi.fn();

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSummary fetches and returns data', async () => {
    const mockResponse = { spending: { total: 100 } };
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await dashboardService.getSummary('user123');

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/dashboard/summary'), {
      headers: { 'x-user-id': 'user123' },
      cache: 'no-store'
    });
  });

  it('getCategories fetches and returns data', async () => {
    const mockResponse = { items: [{ category: 'food' }] };
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await dashboardService.getCategories('user123');

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/spending/categories'), {
      headers: { 'x-user-id': 'user123' },
      cache: 'no-store'
    });
  });
});
