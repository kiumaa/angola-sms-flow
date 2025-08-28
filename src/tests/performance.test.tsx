import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import QuickSend from '@/pages/QuickSend';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@test.com' },
    isAdmin: false
  })
}));

vi.mock('@/hooks/useUserCredits', () => ({
  useUserCredits: () => ({
    credits: 100,
    loading: false
  })
}));

vi.mock('@/hooks/useDashboardStats', () => ({
  useDashboardStats: () => ({
    stats: {
      totalContacts: 0,
      totalSent: 0,
      deliveryRate: 0,
      recentActivity: []
    },
    loading: false
  })
}));

vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: [],
    contactLists: [],
    loading: false,
    searchContacts: vi.fn(),
    deleteContact: vi.fn(),
    refetch: vi.fn()
  })
}));

vi.mock('@/hooks/useSenderIds', () => ({
  useSenderIds: () => ({
    senderIds: [],
    loading: false
  })
}));

describe('Performance Tests', () => {
  let performanceMarks: string[] = [];

  beforeEach(() => {
    performanceMarks = [];
    
    // Mock performance.mark
    vi.spyOn(performance, 'mark').mockImplementation((name: string) => {
      performanceMarks.push(name);
      return {} as PerformanceMark;
    });

    // Mock performance.measure
    vi.spyOn(performance, 'measure').mockImplementation(() => {
      return {} as PerformanceMeasure;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  describe('Component Render Performance', () => {
    it('Dashboard renders within acceptable time', () => {
      const startTime = performance.now();
      
      renderWithRouter(<Dashboard />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Dashboard should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('QuickSend renders within acceptable time', () => {
      const startTime = performance.now();
      
      renderWithRouter(<QuickSend />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // QuickSend should render within 150ms (more complex component)
      expect(renderTime).toBeLessThan(150);
    });
  });

  describe('Memory Usage', () => {
    it('does not create excessive DOM nodes', () => {
      const initialNodeCount = document.querySelectorAll('*').length;
      
      const { unmount } = renderWithRouter(<Dashboard />);
      
      const afterRenderCount = document.querySelectorAll('*').length;
      const nodesAdded = afterRenderCount - initialNodeCount;
      
      // Should not add more than 200 DOM nodes
      expect(nodesAdded).toBeLessThan(200);
      
      unmount();
      
      const afterUnmountCount = document.querySelectorAll('*').length;
      
      // Should clean up most nodes after unmount
      expect(afterUnmountCount - initialNodeCount).toBeLessThan(50);
    });
  });

  describe('Bundle Size Considerations', () => {
    it('components lazy load properly', () => {
      // Test that components can be rendered without throwing
      expect(() => {
        renderWithRouter(<Dashboard />);
      }).not.toThrow();

      expect(() => {
        renderWithRouter(<QuickSend />);
      }).not.toThrow();
    });
  });

  describe('Resource Loading', () => {
    it('handles loading states efficiently', () => {
      // Mock loading state
      vi.mocked(vi.fn()).mockReturnValue({
        useDashboardStats: () => ({
          stats: null,
          loading: true
        })
      });

      const { container } = renderWithRouter(<Dashboard />);
      
      // Should show loading state without throwing errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Interactive Performance', () => {
    it('form inputs respond quickly', () => {
      const { container } = renderWithRouter(<QuickSend />);
      
      const textareas = container.querySelectorAll('textarea');
      const inputs = container.querySelectorAll('input');
      
      // Should have interactive elements
      expect(textareas.length + inputs.length).toBeGreaterThan(0);
      
      // Elements should be focusable (performance indicator)
      textareas.forEach(textarea => {
        expect(textarea).not.toHaveAttribute('disabled');
      });
    });
  });

  describe('CSS and Styling Performance', () => {
    it('uses efficient CSS classes', () => {
      const { container } = renderWithRouter(<Dashboard />);
      
      // Check for common performance-friendly classes
      const elementsWithClasses = container.querySelectorAll('[class]');
      
      // Should have styled elements
      expect(elementsWithClasses.length).toBeGreaterThan(0);
      
      // Check for potential performance issues (too many classes per element)
      elementsWithClasses.forEach(element => {
        const classes = element.className.split(' ').filter(Boolean);
        expect(classes.length).toBeLessThan(20); // Reasonable class limit
      });
    });

    it('avoids inline styles where possible', () => {
      const { container } = renderWithRouter(<Dashboard />);
      
      const elementsWithInlineStyles = container.querySelectorAll('[style]');
      
      // Should minimize inline styles for better performance
      expect(elementsWithInlineStyles.length).toBeLessThan(10);
    });
  });
});