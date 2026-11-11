import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminStatCards } from '@/components/admin/AdminStatCards';
import { VerificationQueue } from '@/components/admin/VerificationQueue';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import * as adminApi from '@/lib/admin.api';

// Mock admin API
vi.mock('@/lib/admin.api', () => ({
  getAdminStats: vi.fn(),
  getPendingUsers: vi.fn(),
  reviewUser: vi.fn(),
  getPendingStartups: vi.fn(),
  reviewStartup: vi.fn(),
  getAdminUsers: vi.fn(),
  toggleSuspendUser: vi.fn(),
  deleteReportedContent: vi.fn(),
  getAdminAuditLogs: vi.fn(),
}));

describe('Admin Module Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStats: adminApi.AdminStats = {
    users: {
      total: 150,
      founders: 90,
      investors: 58,
      admins: 2,
      pending: 12,
    },
    startups: {
      total: 80,
      pending: 8,
      approved: 65,
      rejected: 7,
    },
    connections: {
      total: 120,
    },
    meetings: {
      active: 14,
    },
  };

  describe('1. AdminStatCards Component', () => {
    it('renders all 4 admin metric cards with values and badges', () => {
      render(<AdminStatCards stats={mockStats} loading={false} />);

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByTestId('admin-stat-total-users')).toHaveTextContent('150');
      expect(screen.getByText('12 Pending KYC')).toBeInTheDocument();

      expect(screen.getByText('Startup Pitches')).toBeInTheDocument();
      expect(screen.getByTestId('admin-stat-startup-pitches')).toHaveTextContent('80');
      expect(screen.getByText('8 Pending Review')).toBeInTheDocument();

      expect(screen.getByText('Active Connections')).toBeInTheDocument();
      expect(screen.getByTestId('admin-stat-active-connections')).toHaveTextContent('120');

      expect(screen.getByText('Scheduled Meetings')).toBeInTheDocument();
      expect(screen.getByTestId('admin-stat-scheduled-meetings')).toHaveTextContent('14');
    });
  });

  describe('2. VerificationQueue Component', () => {
    it('renders pending users and handles approval', async () => {
      const mockPendingUsers: adminApi.AdminUser[] = [
        {
          _id: 'user-pending-1',
          name: 'Sarah Applicant',
          email: 'sarah@investor.test',
          role: 'investor',
          verificationStatus: 'pending',
          isSuspended: false,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(adminApi.getPendingUsers).mockResolvedValue({
        success: true,
        data: { users: mockPendingUsers },
      });
      vi.mocked(adminApi.getPendingStartups).mockResolvedValue({
        success: true,
        data: { startups: [] },
      });
      vi.mocked(adminApi.reviewUser).mockResolvedValue({
        success: true,
        data: { user: { ...mockPendingUsers[0], verificationStatus: 'approved' } },
      });

      const onQueueUpdated = vi.fn();
      render(<VerificationQueue onQueueUpdated={onQueueUpdated} />);

      await waitFor(() => {
        expect(screen.getByText('Sarah Applicant')).toBeInTheDocument();
        expect(screen.getByText('sarah@investor.test')).toBeInTheDocument();
      });

      const approveBtn = screen.getByTestId('approve-user-user-pending-1');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(adminApi.reviewUser).toHaveBeenCalledWith('user-pending-1', 'approved');
        expect(onQueueUpdated).toHaveBeenCalled();
      });
    });
  });

  describe('3. UserManagementTable Component', () => {
    it('renders user records and allows toggling suspension', async () => {
      const mockUsers: adminApi.AdminUser[] = [
        {
          _id: 'user-active-1',
          name: 'Bob Founder',
          email: 'bob@startup.test',
          role: 'founder',
          verificationStatus: 'approved',
          isSuspended: false,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(adminApi.getAdminUsers).mockResolvedValue({
        success: true,
        data: {
          users: mockUsers,
          total: 1,
          page: 1,
          totalPages: 1,
        },
      });

      vi.mocked(adminApi.toggleSuspendUser).mockResolvedValue({
        success: true,
        data: { user: { ...mockUsers[0], isSuspended: true } },
      });

      render(<UserManagementTable />);

      await waitFor(() => {
        expect(screen.getByText('Bob Founder')).toBeInTheDocument();
      });

      const suspendBtn = screen.getByTestId('toggle-suspend-user-active-1');
      fireEvent.click(suspendBtn);

      await waitFor(() => {
        expect(adminApi.toggleSuspendUser).toHaveBeenCalledWith('user-active-1', true);
      });
    });
  });
});

