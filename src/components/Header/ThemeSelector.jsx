import React from 'react'
import { useTheme } from './Front';

function ThemeSelector() {
  const { setCurrentTheme } = useTheme();
  return (
    <div className="theme-selector d-flex align-items-center">
      <button 
        className="btn btn-sm btn-outline-secondary me-2"
        onClick={() => setCurrentTheme('theme-1')}
      >
        Theme 1
      </button>
      <button 
        className="btn btn-sm btn-outline-secondary me-2"
        onClick={() => setCurrentTheme('theme-2')}
      >
        Theme 2
      </button>
      <button 
        className="btn btn-sm btn-outline-secondary"
        onClick={() => setCurrentTheme('theme-3')}
      >
        Theme 3
      </button>
      {/* Add buttons for more themes if needed */}
    </div>
  );
}

export default ThemeSelector