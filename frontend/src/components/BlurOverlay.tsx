import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface BlurOverlayProps {
    minDistance: number; // The closest distance to any node
    maxDistance: number; // The distance at which blur is max
}

export const BlurOverlay = ({ minDistance, maxDistance }: BlurOverlayProps) => {
    // Map distance to blur amount (0px to 20px)
    // If minDistance is small, blur is small.
    // If minDistance is large, blur is large.

    // Using framer motion values for smooth transition
    const distance = useMotionValue(minDistance);

    useEffect(() => {
        distance.set(minDistance);
    }, [minDistance]);

    const springDistance = useSpring(distance, { stiffness: 50, damping: 20 });

    const blurAmount = useTransform(springDistance, [0, maxDistance], ["0px", "20px"]);
    const opacity = useTransform(springDistance, [0, maxDistance], [0, 0.8]);

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-50 bg-black/20"
            style={{
                backdropFilter: useTransform(blurAmount, v => `blur(${v})`),
                WebkitBackdropFilter: useTransform(blurAmount, v => `blur(${v})`)
            }}
        >
            <motion.div
                className="absolute inset-0 flex items-center justify-center text-white/50 text-2xl font-light tracking-widest"
                style={{ opacity }}
            >
                NAVIGATE TO LISTEN
            </motion.div>
        </motion.div>
    );
};
