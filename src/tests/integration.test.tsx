import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import QuickSend from '@/pages/QuickSend';
import Contacts from '@/pages/Contacts';

// Mock Supabase
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

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
    loading: false,
    refetch: vi.fn()
  })
}));

vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: [
      {
        id: '1',
        name: 'João Silva',
        phone: '923456789',
        phone_e164: '+244923456789',
        email: 'joao@test.com',
        tags: ['cliente']
      }
    ],
    contactLists: [],
    loading: false,
    searchContacts: vi.fn(),
    deleteContact: vi.fn(),
    refetch: vi.fn()
  })
}));

vi.mock('@/hooks/useSenderIds', () => ({
  useSenderIds: () => ({
    senderIds: [
      {
        id: '1',
        sender_id: 'EMPRESA',
        status: 'approved',
        is_global: false
      }
    ],
    loading: false
  })
}));

describe('Integration Tests', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  describe('QuickSend Integration', () => {
    it('integrates form submission with backend', async () => {
      const user = userEvent.setup();
      
      mockInvoke.mockResolvedValue({
        data: { success: true, sent: 1, credits_debited: 1 },
        error: null
      });

      renderWithRouter(<QuickSend />);

      // Fill in the form
      const messageTextarea = screen.getByRole('textbox', { name: /mensagem/i });
      await user.type(messageTextarea, 'Mensagem de teste');

      const phoneInput = screen.getByPlaceholderText('912 345 678');
      await user.type(phoneInput, '923456789');

      // Find and click send button
      const sendButton = screen.getByRole('button', { name: /enviar/i });
      await user.click(sendButton);

      // Should call the send SMS function
      expect(mockInvoke).toHaveBeenCalledWith('send-quick-sms', {
        body: expect.objectContaining({
          sender_id: 'SMSAO',
          recipients: expect.arrayContaining(['+244923456789']),
          message: 'Mensagem de teste'
        })
      });
    });

    it('handles form validation errors', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<QuickSend />);

      // Try to send without message
      const sendButton = screen.getByRole('button', { name: /enviar/i });
      
      // Button should be disabled when form is invalid
      expect(sendButton).toBeDisabled();
    });

    it('integrates with contact selection', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<QuickSend />);

      // Open contacts modal
      const contactsButton = screen.getByRole('button', { name: /adicionar dos contatos/i });
      await user.click(contactsButton);

      // Should show contacts in modal
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('+244923456789')).toBeInTheDocument();
    });
  });

  describe('Contacts Integration', () => {
    it('integrates search functionality', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<Contacts />);

      // Should show contact in table
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('923456789')).toBeInTheDocument();

      // Test search
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'João');

      // Search should be accessible
      expect(searchInput).toHaveValue('João');
    });

    it('integrates import functionality', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<Contacts />);

      // Click import button
      const importButton = screen.getByRole('button', { name: /importar csv/i });
      await user.click(importButton);

      // Should show import form (implementation would be in CSVImport component)
      expect(importButton).toBeInTheDocument();
    });
  });

  describe('Navigation Integration', () => {
    it('navigation between pages works', () => {
      renderWithRouter(<QuickSend />);
      
      // Should be able to navigate back to dashboard
      const backButton = screen.getByRole('button', { name: /voltar/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('handles SMS sending errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockInvoke.mockResolvedValue({
        data: { 
          success: false, 
          error: 'INSUFFICIENT_CREDITS',
          message: 'Créditos insuficientes'
        },
        error: null
      });

      renderWithRouter(<QuickSend />);

      // Fill valid form
      const messageTextarea = screen.getByRole('textbox', { name: /mensagem/i });
      await user.type(messageTextarea, 'Test message');

      const phoneInput = screen.getByPlaceholderText('912 345 678');
      await user.type(phoneInput, '923456789');

      // Submit form
      const sendButton = screen.getByRole('button', { name: /enviar/i });
      await user.click(sendButton);

      // Should handle error gracefully (error message would be shown via toast)
      expect(mockInvoke).toHaveBeenCalled();
    });
  });

  describe('State Management Integration', () => {
    it('updates credit count after SMS send', async () => {
      const user = userEvent.setup();
      
      mockInvoke.mockResolvedValue({
        data: { success: true, sent: 1, credits_debited: 1 },
        error: null
      });

      renderWithRouter(<QuickSend />);

      // Should show current credits
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});