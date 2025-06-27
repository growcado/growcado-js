import { render, screen } from '@testing-library/react';

import GrowcadoReact from './react';

describe('GrowcadoReact', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<GrowcadoReact />);
    expect(baseElement).toBeTruthy();
  });

  it('should display SDK message', () => {
    render(<GrowcadoReact />);
    expect(screen.getByText(/Core SDK says: sdk/)).toBeDefined();
  });

  it('should display custom message when provided', () => {
    const customMessage = 'Hello from React!';
    render(<GrowcadoReact message={customMessage} />);
    expect(screen.getByText(`Custom message: ${customMessage}`)).toBeDefined();
  });
});
