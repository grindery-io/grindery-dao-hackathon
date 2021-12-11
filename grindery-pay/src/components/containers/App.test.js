import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const passcodeElement = screen.getByText(/Enter your pass code/i);
  expect(passcodeElement).toBeInTheDocument();
});
