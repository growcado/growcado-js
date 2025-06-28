import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useGrowcado, GrowcadoWidget } from './react';

describe('useGrowcado', () => {
  it('should return SDK and version', () => {
    const { result } = renderHook(() => useGrowcado());
    
    expect(result.current.sdk).toBeDefined();
    expect(result.current.version).toBe('sdk');
    expect(typeof result.current.sdk).toBe('function');
  });
});

describe('GrowcadoWidget', () => {
  it('should render SDK information', () => {
    const { container } = render(<GrowcadoWidget />);
    
    expect(screen.getByText('Growcado SDK')).toBeTruthy();
    expect(screen.getByText('Version: sdk')).toBeTruthy();
    expect(container.textContent).toContain('Growcado SDK');
    expect(container.textContent).toContain('Version: sdk');
  });
});
