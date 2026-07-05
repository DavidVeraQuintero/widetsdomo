import { useEffect, useState } from 'react';

export function useResponsiveGrid() {
  const [gridCols, setGridCols] = useState(12);

  useEffect(() => {
    function calculateGridCols() {
      const width = window.innerWidth;

      if (width <= 480) return 4;      // Móvil
      if (width <= 1024) return 8;     // Tablet
      return 12;                       // Desktop
    }

    const cols = calculateGridCols();
    setGridCols(cols);

    function handleResize() {
      const newCols = calculateGridCols();
      setGridCols(newCols);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return gridCols;
}
