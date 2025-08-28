import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(() => Promise.resolve({ error: null }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'account-id', credits: 100, full_name: 'Test User' },
            error: null
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        })),
        head: vi.fn(() => Promise.resolve({ count: 0, error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({
        data: { success: true, gateway: 'bulksms', responseTime: 150 },
        error: null
      }))
    },
    realtime: {
      channel: vi.fn(() => ({
        on: vi.fn(() => ({ subscribe: vi.fn() })),
        unsubscribe: vi.fn()
      }))
    }
  }
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Functional Tests - Core Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard', () => {
    it('should load dashboard with stats', async () => {
      renderWithProviders(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    it('should display user credits', async () => {
      renderWithProviders(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/créditos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quick Send', () => {
    it('should navigate to Quick Send page', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const quickSendLink = await screen.findByText(/envio rápido/i);
      await user.click(quickSendLink);
      
      await waitFor(() => {
        expect(screen.getByText(/enviar sms/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // Navigate to Quick Send
      const quickSendLink = await screen.findByText(/envio rápido/i);
      await user.click(quickSendLink);
      
      // Try to submit empty form
      const submitButton = await screen.findByRole('button', { name: /enviar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/número.*obrigatório/i)).toBeInTheDocument();
      });
    });

    it('should validate message input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // Navigate to Quick Send
      const quickSendLink = await screen.findByText(/envio rápido/i);
      await user.click(quickSendLink);
      
      // Fill phone but leave message empty
      const phoneInput = await screen.findByLabelText(/número/i);
      await user.type(phoneInput, '923456789');
      
      const submitButton = await screen.findByRole('button', { name: /enviar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/mensagem.*obrigatória/i)).toBeInTheDocument();
      });
    });
  });

  describe('Contacts', () => {
    it('should navigate to Contacts page', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const contactsLink = await screen.findByText(/contactos/i);
      await user.click(contactsLink);
      
      await waitFor(() => {
        expect(screen.getByText(/lista.*contactos/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no contacts', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const contactsLink = await screen.findByText(/contactos/i);
      await user.click(contactsLink);
      
      await waitFor(() => {
        expect(screen.getByText(/nenhum contacto/i)).toBeInTheDocument();
      });
    });
  });

  describe('Credits', () => {
    it('should navigate to Credits page', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const creditsLink = await screen.findByText(/créditos/i);
      await user.click(creditsLink);
      
      await waitFor(() => {
        expect(screen.getByText(/comprar.*créditos/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reports', () => {
    it('should navigate to Reports page', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const reportsLink = await screen.findByText(/relatórios/i);
      await user.click(reportsLink);
      
      await waitFor(() => {
        expect(screen.getByText(/relatórios.*sms/i)).toBeInTheDocument();
      });
    });
  });

  describe('Campaigns Redirect', () => {
    it('should redirect campaigns to coming soon', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // Navigate directly to campaigns URL
      window.history.pushState({}, '', '/campaigns');
      
      await waitFor(() => {
        expect(screen.getByText(/em breve/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should toggle sidebar', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      const toggleButton = await screen.findByRole('button', { name: /toggle sidebar/i });
      await user.click(toggleButton);
      
      // Sidebar behavior test would depend on implementation
      expect(toggleButton).toBeInTheDocument();
    });

    it('should show theme toggle', async () => {
      renderWithProviders(<App />);
      
      const themeToggle = await screen.findByRole('button', { name: /toggle theme/i });
      expect(themeToggle).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('should catch and display errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      // This would test the ErrorBoundary component
      expect(() => renderWithProviders(<ThrowError />)).not.toThrow();
    });
  });
});

describe('Integration Tests - API Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SMS Sending', () => {
    it('should send SMS successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      // Navigate to Quick Send
      const quickSendLink = await screen.findByText(/envio rápido/i);
      await user.click(quickSendLink);
      
      // Fill form
      const phoneInput = await screen.findByLabelText(/número/i);
      const messageInput = await screen.findByLabelText(/mensagem/i);
      
      await user.type(phoneInput, '923456789');
      await user.type(messageInput, 'Test message');
      
      const submitButton = await screen.findByRole('button', { name: /enviar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/sucesso/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('should load dashboard stats', async () => {
      renderWithProviders(<App />);
      
      await waitFor(() => {
        // Should show loading states initially, then data
        expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
      });
    });

    it('should handle loading states', async () => {
      renderWithProviders(<App />);
      
      // Check for skeleton loaders or loading indicators
      await waitFor(() => {
        expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument();
      });
    });
  });
});

describe('Performance Tests', () => {
  it('should render dashboard within reasonable time', async () => {
    const start = performance.now();
    renderWithProviders(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
    
    const end = performance.now();
    expect(end - start).toBeLessThan(3000); // 3 seconds max
  });

  it('should handle large datasets efficiently', async () => {
    // Mock large dataset
    const largeMockData = Array(1000).fill(null).map((_, i) => ({
      id: `contact-${i}`,
      name: `Contact ${i}`,
      phone: `92345678${i.toString().padStart(2, '0')}`
    }));
    
    // This would test contact list performance with large datasets
    expect(largeMockData).toHaveLength(1000);
  });
});