import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StartupCard } from '@/components/investor/StartupCard';
import { FilterSidebar } from '@/components/investor/FilterSidebar';
import { DocumentAccessRow } from '@/components/investor/DocumentAccessRow';
import * as investorApi from '@/lib/investor.api';
import { Startup, StartupDocument } from '@/lib/founder.api';

// Mock investor API
vi.mock('@/lib/investor.api', () => ({
  browseStartups: vi.fn(),
  getStartupDetails: vi.fn(),
  getDocumentAccess: vi.fn(),
  requestDocumentAccess: vi.fn(),
  sendConnectionRequest: vi.fn(),
  saveStartup: vi.fn(),
  unsaveStartup: vi.fn(),
  getSavedStartups: vi.fn(),
  getMyInvestorRequests: vi.fn(),
  getInvestorProfile: vi.fn(),
  updateInvestorProfile: vi.fn(),
}));

describe('Investor Module Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStartup: Startup = {
    _id: 'startup-999',
    name: 'Perovskite Solar Labs',
    tagline: 'High efficiency solar panels using tandem perovskite',
    industry: 'CleanTech',
    stage: 'seed' as any,
    problem: 'Traditional silicon efficiency is capped at 26%',
    solution: 'Perovskite tandem cells reaching 33% efficiency',
    fundingAsk: 1200000,
    equityOffered: 15,
    status: 'approved',
    viewsCount: 42,
    team: [{ name: 'Elena Rostova', role: 'CEO & Founder' }],
  };

  describe('1. StartupCard Component', () => {
    it('renders startup information and handles Save & Connect buttons', () => {
      const onToggleSave = vi.fn();
      const onConnect = vi.fn();

      render(
        <StartupCard
          startup={mockStartup}
          isSaved={false}
          onToggleSave={onToggleSave}
          onConnect={onConnect}
        />
      );

      // Verify name, tagline, stage, funding ask
      expect(screen.getByText('Perovskite Solar Labs')).toBeInTheDocument();
      expect(screen.getByText(/High efficiency solar panels/i)).toBeInTheDocument();
      expect(screen.getByText('seed')).toBeInTheDocument();
      expect(screen.getByText('$1,200k')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();

      // Test Save button
      const saveBtn = screen.getByTestId('save-btn-startup-999');
      fireEvent.click(saveBtn);
      expect(onToggleSave).toHaveBeenCalledWith('startup-999');

      // Test Connect button
      const connectBtn = screen.getByTestId('connect-btn-startup-999');
      fireEvent.click(connectBtn);
      expect(onConnect).toHaveBeenCalledWith(mockStartup);
    });
  });

  describe('2. FilterSidebar Component', () => {
    it('handles changing industry, sorting, and reset', () => {
      const onChange = vi.fn();
      const onReset = vi.fn();

      render(
        <FilterSidebar
          filters={{ industry: 'all', sort: 'recent', stage: 'all' }}
          onChange={onChange}
          onReset={onReset}
        />
      );

      // Change industry
      const industrySelect = screen.getByTestId('filter-industry-select');
      fireEvent.change(industrySelect, { target: { value: 'CleanTech' } });
      expect(onChange).toHaveBeenCalledWith({ industry: 'CleanTech', page: 1 });

      // Change sort
      const sortSelect = screen.getByTestId('filter-sort-select');
      fireEvent.change(sortSelect, { target: { value: 'views' } });
      expect(onChange).toHaveBeenCalledWith({ sort: 'views', page: 1 });

      // Click Reset
      const resetBtn = screen.getByTitle('Reset all filters');
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('3. DocumentAccessRow Component (Document Access Rules)', () => {
    it('public document displays "Open Document" and opens signed URL on click', async () => {
      const publicDoc: StartupDocument = {
        _id: 'doc-public-1',
        startupId: 'startup-999',
        title: 'Public One-Pager',
        type: 'pitch_deck',
        fileUrl: 'https://storage.founderlink.com/onepager.pdf',
        fileType: 'application/pdf',
        fileSize: 1048576,
        accessLevel: 'public',
        createdAt: new Date().toISOString(),
      };

      vi.mocked(investorApi.getDocumentAccess).mockResolvedValue({
        success: true,
        data: {
          document: publicDoc,
          signedUrl: 'https://storage.founderlink.com/onepager.pdf?signature=xyz&expires=999999',
          expiresIn: 300,
        },
      });

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      render(<DocumentAccessRow document={publicDoc} />);

      expect(screen.getByText('Public One-Pager')).toBeInTheDocument();
      expect(screen.getByText('Public')).toBeInTheDocument();

      const openBtn = screen.getByTestId('open-doc-btn-doc-public-1');
      expect(openBtn).toBeInTheDocument();

      fireEvent.click(openBtn);

      await waitFor(() => {
        expect(investorApi.getDocumentAccess).toHaveBeenCalledWith('doc-public-1');
        expect(openSpy).toHaveBeenCalledWith(
          expect.stringContaining('signature=xyz'),
          '_blank',
          expect.anything()
        );
      });
    });

    it('locked document without approval displays "Request Access" button and handles request', async () => {
      const lockedDoc: StartupDocument = {
        _id: 'doc-locked-1',
        startupId: 'startup-999',
        title: 'Confidential Financial Model',
        type: 'financial',
        fileUrl: 'https://storage.founderlink.com/financials.pdf',
        fileType: 'application/pdf',
        fileSize: 2097152,
        accessLevel: 'locked',
        createdAt: new Date().toISOString(),
      };

      vi.mocked(investorApi.requestDocumentAccess).mockResolvedValue({
        success: true,
        data: { accessRequest: { _id: 'req-1', status: 'pending' } },
      });

      const onRequestSuccess = vi.fn();

      render(
        <DocumentAccessRow
          document={lockedDoc}
          hasApprovedAccess={false}
          onRequestSuccess={onRequestSuccess}
        />
      );

      expect(screen.getByText('Confidential Financial Model')).toBeInTheDocument();
      expect(screen.getByText('Locked')).toBeInTheDocument();

      const reqBtn = screen.getByTestId('request-doc-btn-doc-locked-1');
      expect(reqBtn).toBeInTheDocument();

      fireEvent.click(reqBtn);

      await waitFor(() => {
        expect(investorApi.requestDocumentAccess).toHaveBeenCalledWith('doc-locked-1');
        expect(screen.getByText('Access Pending')).toBeInTheDocument();
        expect(onRequestSuccess).toHaveBeenCalled();
      });
    });

    it('locked document with approved access displays "Open Document"', async () => {
      const lockedDoc: StartupDocument = {
        _id: 'doc-locked-approved',
        startupId: 'startup-999',
        title: 'Audited Balance Sheet',
        type: 'financial',
        fileUrl: 'https://storage.founderlink.com/balance-sheet.pdf',
        fileType: 'application/pdf',
        fileSize: 1048576,
        accessLevel: 'locked',
        createdAt: new Date().toISOString(),
      };

      render(
        <DocumentAccessRow
          document={lockedDoc}
          hasApprovedAccess={true}
        />
      );

      expect(screen.getByText('Open Document')).toBeInTheDocument();
      expect(screen.queryByText('Request Access')).not.toBeInTheDocument();
    });

    it('approved_only document with accepted connection displays "Open Document"', async () => {
      const approvedOnlyDoc: StartupDocument = {
        _id: 'doc-approved-only-1',
        startupId: 'startup-999',
        title: 'Cap Table & Convertible Notes',
        type: 'legal',
        fileUrl: 'https://storage.founderlink.com/cap-table.pdf',
        fileType: 'application/pdf',
        fileSize: 1048576,
        accessLevel: 'approved_only',
        createdAt: new Date().toISOString(),
      };

      render(
        <DocumentAccessRow
          document={approvedOnlyDoc}
          hasAcceptedConnection={true}
        />
      );

      expect(screen.getByText('Open Document')).toBeInTheDocument();
    });
  });
});

