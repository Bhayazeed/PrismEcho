import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

interface AudioSource {
    id: string;
    x: number;
    y: number;
    src: string; // URL to audio file
}

export const useSpatialAudio = (userX: number, userY: number, sources: AudioSource[]) => {
    const howls = useRef<Record<string, Howl>>({});
    const [distances, setDistances] = useState<Record<string, number>>({});

    // Initialize audio sources
    useEffect(() => {
        sources.forEach(source => {
            if (!howls.current[source.id]) {
                const sound = new Howl({
                    src: [source.src],
                    format: ['webm', 'm4a', 'wav', 'mp3'], // Hint format for proper decoding
                    autoplay: true,
                    loop: true,
                    volume: 0,
                });
                howls.current[source.id] = sound;
            }
        });

        // Cleanup
        return () => {
            // Optional: stop sounds on unmount
            // Object.values(howls.current).forEach(h => h.stop());
        };
    }, [sources]);

    // Update volumes based on distance
    useEffect(() => {
        const newDistances: Record<string, number> = {};
        const MAX_DISTANCE = 150; // Drastically reduced to prevent overlap
        const MIN_DISTANCE = 20;  // pixels

        sources.forEach(source => {
            const dist = Math.sqrt(Math.pow(source.x - userX, 2) + Math.pow(source.y - userY, 2));
            newDistances[source.id] = dist;

            const vol = Math.max(0, 1 - Math.max(0, dist - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE));

            if (howls.current[source.id]) {
                howls.current[source.id].volume(vol);
            }
        });
        setDistances(newDistances);
    }, [userX, userY, sources]);

    return { distances };
};
