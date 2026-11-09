import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatCards } from '@/components/founder/StatCards';
import { StartupForm } from '@/components/founder/StartupForm';
import { DocumentManager } from '@/components/founder/DocumentManager';
import { RequestsInbox } from '@/components/founder/RequestsInbox';
import * as founderApi from '@/lib/founder.api';

// Mock founder API
vi.mock('@lib/founder.api', () => ({
  createStartup: vi.fn(),
  uploadStartupDocument: vi.fn(),
  getStartupDocuments: vi.fn(),
  updateDocumentAccessLevel: vi.fn(),
  deleteDocument: vi.fn(),
  getAccessRequests: vi.fn(),
  updateAccessRequest: vi.fn(),
  getConnectionRequests: vi.fn(),
  updateConnectionRequest: vi.fn(),
}));

// Also mock relative module path for Vitest resolution
vi.mock('@/lib/founder.api', () => ({
  createStartup: vi.fn(),
  uploadStartupDocument: vi.fn(),
  getStartupDocuments: vi.fn(),
  updateDocumentAccessLevel: vi.fn(),
  deleteDocument: vi.fn(),
  getAccessRequests: vi.fn(),
  updateAccessRequest: vi.fn(),
  getConnectionRequests: vi.fn(),
  updateConnectionRequest: vi.fn(),
}));

describe('Founder Module Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. StatCards Component', () => {
    it('renders all 4 stat cards with values and pending badge', () => {
      const mockStats: founderApi.FounderStats = {
        profileViews: 128,
        startupViews: 450,
        accessRequests: { total: 12, pending: 3 },
        connectionRequests: { total: 8, pending: 2 },
        recentActivity: [],
      };

      render(<StatCards stats={mockStats} loading={false} />);

      expect(screen.getByText('Profile Views')).toBeInTheDocument();
      expect(screen.getByTestId('stat-profile-views')).toHaveTextContent('128');

      expect(screen.getByText('Startup Views')).toBeInTheDocument();
      expect(screen.getByTestId('stat-startup-views')).toHaveTextContent('450');

      expect(screen.getByText('Access Requests')).toBeInTheDocument();
      expect(screen.getByTestId('stat-access-requests')).toHaveTextContent('12');
      expect(screen.getByText('3 pending')).toBeInTheDocument();

      expect(screen.getByText('Connection Requests')).toBeInTheDocument();
      expect(screen.getByTestId('stat-connection-requests')).toHaveTextContent('8');
      expect(screen.getByText('2 pending')).toBeInTheDocument();
    });

    it('renders skeleton loading state when loading is true', () => {
      const { container } = render(<StatCards stats={null} loading={true} />);
      const pulseDivs = container.getElementsByClassName('animate-pulse');
      expect(pulseDivs.length).toBeGreaterThan(0);
    });
  });

  describe('2. StartupForm Multi-Step Flow', () => {
    it('validates Step 1 and allows navigating through all 5 steps to submission', async () => {
      const mockOnSuccess = vi.fn();
      const mockCreatedStartup = {
        _id: 'startup-123',
        name: 'Nexus Quantum',
        tagline: 'Quantum encryption for everyone',
        industry: 'Cybersecurity',
        stage: 'mvp' as const,
        problem: 'Quantum computers will crack modern RSA encryption',
        solution: 'Lattice-based post-quantum cryptography API',
        team: [{ name: 'Dr. Jane Doe', role: 'Chief Scientist' }],
        status: 'pending' as const,
      };

      vi.mocked(founderApi.createStartup).mockResolvedValue({
        success: true,
        data: mockCreatedStartup,
      });

      render(<StartupForm onSuccess={mockOnSuccess} />);

      // STEP 1: Basics
      expect(screen.getByText('Post Your Startup')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g. Acme AI/i)).toBeInTheDocument();

      // Attempt to click Next without filling name -> validation error
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));
      expect(screen.getByText(/Please enter your startup name/i)).toBeInTheDocument();

      // Fill in Step 1
      fireEvent.change(screen.getByPlaceholderText(/e.g. Acme AI/i), {
        target: { value: 'Nexus Quantum' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Autonomous workflows/i), {
        target: { value: 'Quantum encryption for everyone' },
      });

      // Advance to Step 2
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      // STEP 2: Problem & Market
      expect(screen.getByPlaceholderText(/What pain point does your customer experience/i)).toBeInTheDocument();
      fireEvent.change(screen.getByPlaceholderText(/What pain point does your customer experience/i), {
        target: { value: 'Quantum computers will crack modern RSA encryption' },
      });
      fireEvent.change(screen.getByPlaceholderText(/How does your product solve this/i), {
        target: { value: 'Lattice-based post-quantum cryptography API' },
      });

      // Advance to Step 3
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      // STEP 3: Team
      expect(screen.getByText('Core Team Members')).toBeInTheDocument();
      const nameInput = screen.getByPlaceholderText(/Full Name \*/i);
      fireEvent.change(nameInput, { target: { value: 'Dr. Jane Doe' } });

      // Advance to Step 4
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      // STEP 4: Funding
      expect(screen.getByPlaceholderText('500000')).toBeInTheDocument();
      fireEvent.change(screen.getByPlaceholderText('500000'), { target: { value: '750000' } });
      fireEvent.change(screen.getByPlaceholderText('10'), { target: { value: '12' } });

      // Advance to Step 5
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));

      // STEP 5: Documents
      expect(screen.getByText(/Attach Initial Document \(Optional\)/i)).toBeInTheDocument();

      // Submit Form
      const submitBtn = screen.getByRole('button', { name: /Complete & Post Pitch/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(founderApi.createStartup).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Nexus Quantum',
            tagline: 'Quantum encryption for everyone',
            fundingAsk: 750000,
            equityOffered: 12,
          })
        );
        expect(mockOnSuccess).toHaveBeenCalledWith(mockCreatedStartup);
      });
    });
  });

  describe('3. DocumentManager Component', () => {
    it('loads documents, allows changing accessLevel and deleting a document', async () => {
      const mockDocs: founderApi.StartupDocument[] = [
        {
          _id: 'doc-1',
          startupId: 'startup-123',
          title: 'Pitch Deck Q1',
          type: 'pitch_deck',
          fileUrl: 'https://example.com/pitch.pdf',
          fileType: 'application/pdf',
          fileSize: 1048576,
          accessLevel: 'approved_only',
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(founderApi.getStartupDocuments).mockResolvedValue({
        success: true,
        data: mockDocs,
      });

      vi.mocked(founderApi.updateDocumentAccessLevel).mockResolvedValue({
        success: true,
        data: { ...mockDocs[0], accessLevel: 'public' },
      });

      vi.mocked(founderApi.deleteDocument).mockResolvedValue({
        success: true,
      });

      // Mock window.confirm to return true
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<DocumentManager startupId="startup-123" startupName="Nexus Quantum" />);

      // Wait for documents to load
      await waitFor(() => {
        expect(screen.getByText('Pitch Deck Q1')).toBeInTheDocument();
      });

      // Change accessLevel
      const select = screen.getByTestId('access-select-doc-1');
      fireEvent.change(select, { target: { value: 'public' } });

      await waitFor(() => {
        expect(founderApi.updateDocumentAccessLevel).toHaveBeenCalledWith('doc-1', 'public');
      });

      // Delete document
      const deleteBtn = screen.getByTestId('delete-doc-doc-1');
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(founderApi.deleteDocument).toHaveBeenCalledWith('doc-1');
      });
    });
  });

  describe('4. RequestsInbox Component', () => {
    it('renders access requests and handles Approve action', async () => {
      const mockAccessRequests: founderApi.AccessRequestItem[] = [
        {
          _id: 'req-1',
          investorId: {
            _id: 'inv-1',
            name: 'Sarah Connor',
            email: 'sarah@sequoia.test',
          },
          documentId: {
            _id: 'doc-1',
            title: 'Financial Projections',
            type: 'financial',
          },
          startupId: {
            _id: 'startup-123',
            name: 'Nexus Quantum',
          },
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];

      const mockConnections: founderApi.ConnectionItem[] = [
        {
          _id: 'conn-1',
          investorId: {
            _id: 'inv-2',
            name: 'Peter Gregory',
            email: 'peter@raviga.test',
          },
          startupId: {
            _id: 'startup-123',
            name: 'Nexus Quantum',
          },
          status: 'pending',
          message: 'Loved your quantum proposition!',
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(founderApi.getAccessRequests).mockResolvedValue({
        success: true,
        data: mockAccessRequests,
      });

      vi.mocked(founderApi.getConnectionRequests).mockResolvedValue({
        success: true,
        data: mockConnections,
      });

      vi.mocked(founderApi.updateAccessRequest).mockResolvedValue({
        success: true,
        data: { ...mockAccessRequests[0], status: 'approved' },
      });

      vi.mocked(founderApi.updateConnectionRequest).mockResolvedValue({
        success: true,
        data: { ...mockConnections[0], status: 'accepted' },
      });

      const onStatusChange = vi.fn();
      render(<RequestsInbox onStatusChange={onStatusChange} />);

      // Verify access request rendered
      await waitFor(() => {
        expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
        expect(screen.getByText('Financial Projections')).toBeInTheDocument();
      });

      // Click Approve
      const approveBtn = screen.getByTestId('approve-access-req-1');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(founderApi.updateAccessRequest).toHaveBeenCalledWith('req-1', 'approved');
        expect(onStatusChange).toHaveBeenCalled();
      });

      // Switch to Connection Requests tab
      const connTabBtn = screen.getByRole('button', { name: /Investor Connections/i });
      fireEvent.click(connTabBtn);

      // Verify connection request rendered
      await waitFor(() => {
        expect(screen.getByText('Peter Gregory')).toBeInTheDocument();
        expect(screen.getByText(/"Loved your quantum proposition!"/i)).toBeInTheDocument();
      });

      // Click Accept
      const acceptBtn = screen.getByTestId('accept-conn-conn-1');
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(founderApi.updateConnectionRequest).toHaveBeenCalledWith('conn-1', 'accepted');
      });
    });
  });
});

