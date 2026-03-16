import { useEffect, useRef } from 'react';

export function useBarcodeScanner(onScan: (data: string) => void) {
    const buffer = useRef('');
    const lastKeyTime = useRef(Date.now());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTime.current;

            if (timeDiff > 50) {
                buffer.current = '';
            }

            if (e.key === 'Enter' && buffer.current.length > 2) {
                e.preventDefault();

                onScan(buffer.current);
                buffer.current = '';
                return;
            }

            if (e.key.length === 1) {
                buffer.current += e.key;
            }

            lastKeyTime.current = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onScan]);
}