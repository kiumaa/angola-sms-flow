import * as React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/hooks/useAuth'
import QuickSend from '@/pages/QuickSend'

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' }
  })
}))

vi.mock('@/hooks/useUserCredits', () => ({
  useUserCredits: () => ({
    credits: 100,
    loading: false,
    refetch: vi.fn()
  })
}))

vi.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: [],
    loading: false
  })
}))

vi.mock('@/hooks/useSenderIds', () => ({
  useSenderIds: () => ({
    senderIds: [],
    loading: false
  })
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider attribute="class">
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('QuickSend', () => {
  it('renders quick send page', () => {
    render(
      <TestWrapper>
        <QuickSend />
      </TestWrapper>
    )
  })
})