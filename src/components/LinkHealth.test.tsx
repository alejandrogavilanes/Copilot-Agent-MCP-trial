import { render, fireEvent, waitFor } from '@testing-library/preact';
import { LinkHealth } from './LinkHealth';
import { getLinkHealthStats } from '../utils/link-validator';
import { vi } from 'vitest';

vi.mock('../utils/link-validator', () => ({
  getLinkHealthStats: vi.fn()
}));

describe('LinkHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStats = {
    total: 10,
    statuses: {
      active: 7,
      error: 2,
      pending: 1
    },
    lastValidated: '2025-04-11T10:00:00Z'
  };

  it('renders loading state initially', () => {
    (getLinkHealthStats as any).mockResolvedValue(null);
    const { getByText } = render(<LinkHealth listId="123" />);
    expect(getByText('Loading...')).toBeTruthy();
  });

  it('displays link health statistics', async () => {
    (getLinkHealthStats as any).mockResolvedValue(mockStats);
    const { getByText } = render(<LinkHealth listId="123" />);

    await waitFor(() => {
      expect(getByText('10')).toBeTruthy();
      expect(getByText('7')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
    });
  });

  it('handles validate button click', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    (getLinkHealthStats as any).mockResolvedValue(mockStats);

    const { getByText } = render(<LinkHealth listId="123" />);
    
    await waitFor(() => {
      expect(getByText('Check All Links')).toBeTruthy();
    });

    const button = getByText('Check All Links');
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/lists/123/validate', {
        method: 'POST'
      });
    });
  });

  it('shows validating state during validation', async () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    (getLinkHealthStats as any).mockResolvedValue(mockStats);

    const { getByText } = render(<LinkHealth listId="123" />);
    
    await waitFor(() => {
      expect(getByText('Check All Links')).toBeTruthy();
    });

    const button = getByText('Check All Links');
    fireEvent.click(button);

    await waitFor(() => {
      expect(getByText('Validating...')).toBeTruthy();
    });
  });
});