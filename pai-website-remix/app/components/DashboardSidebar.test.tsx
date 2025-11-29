import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSidebar } from './DashboardSidebar';

describe('DashboardSidebar', () => {
  it('should render PAI logo', () => {
    render(<DashboardSidebar currentPath="/dashboard" userRole="basic" />);
    expect(screen.getByText('PAI')).toBeInTheDocument();
  });

  it('should render Dashboard link', () => {
    render(<DashboardSidebar currentPath="/dashboard" userRole="basic" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render My Requests link', () => {
    render(<DashboardSidebar currentPath="/dashboard" userRole="basic" />);
    expect(screen.getByText('My Requests')).toBeInTheDocument();
  });

  it('should render Insurance link', () => {
    render(<DashboardSidebar currentPath="/dashboard" userRole="basic" />);
    expect(screen.getByText('Insurance')).toBeInTheDocument();
  });

  it('should render Take Test link', () => {
    render(<DashboardSidebar currentPath="/dashboard" userRole="basic" />);
    expect(screen.getByText('Take Test')).toBeInTheDocument();
  });

  it('should render Logout button', () => {
    render(<DashboardSidebar currentPath="/dashboard" userRole="basic" />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should render Admin Panel for instructor role', () => {
    render(<DashboardSidebar currentPath="/dashboard" userRole="instructor" />);
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('should not render Admin Panel for basic role', () => {
    render(<DashboardSidebar currentPath="/dashboard" userRole="basic" />);
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('should highlight active path', () => {
    const { container } = render(<DashboardSidebar currentPath="/insurance" userRole="basic" />);
    const insuranceLink = screen.getByText('Insurance').closest('a');
    expect(insuranceLink).toHaveClass('from-sky-500');
  });

  it('should not highlight inactive paths', () => {
    const { container } = render(<DashboardSidebar currentPath="/dashboard" userRole="basic" />);
    const insuranceLink = screen.getByText('Insurance').closest('a');
    expect(insuranceLink).not.toHaveClass('from-sky-500');
  });
});
