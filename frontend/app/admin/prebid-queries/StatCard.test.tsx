import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard icon={<span>icon</span>} value={42} label="Pending" border="border-yellow-500" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders a string value as-is (e.g. a percentage)', () => {
    render(<StatCard icon={<span>icon</span>} value="87%" label="Avg Confidence" border="border-purple-500" />);
    expect(screen.getByText('87%')).toBeInTheDocument();
  });
});
