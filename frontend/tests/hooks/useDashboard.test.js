// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useDashboard from '../../hooks/useDashboard';
import { dashboardService } from '../../lib/api/dashboardService';

// Mock the service
vi.mock('../../lib/api/dashboardService', () => ({
  dashboardService: {
    getSummary: vi.fn(),
    getCategories: vi.fn(),
  }
}));

describe('useDashboard hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches dashboard data successfully', async () => {
    const mockSummary = { spending: { total: 100 } };
    const mockCategories = { items: [{ category: 'food', total: 100 }] };
    
    dashboardService.getSummary.mockResolvedValue(mockSummary);
    dashboardService.getCategories.mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useDashboard());
    
    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for the hook to finish loading
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSummary);
    expect(result.current.categories).toEqual(mockCategories.items);
    
    expect(dashboardService.getSummary).toHaveBeenCalledWith('demo-user');
    expect(dashboardService.getCategories).toHaveBeenCalledWith('demo-user');
  });

  it('handles API errors gracefully', async () => {
    dashboardService.getSummary.mockRejectedValue(new Error('Network error'));
    dashboardService.getCategories.mockResolvedValue({ items: [] });

    const { result } = renderHook(() => useDashboard());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
  });
});
