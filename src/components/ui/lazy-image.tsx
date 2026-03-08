'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useInView } from 'framer-motion';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface LazyImageProps {
  alt: string;
  src: string;
  className?: string;
  AspectRatioClassName?: string;
  /** URL of the fallback image. default: undefined */
  fallback?: string;
  /** The ratio of the image. */
  ratio: number;
  /** Whether the image should only load when it is in view. default: false */
  inView?: boolean;
}

export function LazyImage({
  alt,
  src,
  ratio,
  fallback,
  inView = false,
  className,
  AspectRatioClassName,
}: LazyImageProps) {
  const ref = React.useRef(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const isInView = useInView(ref, { once: true });

  const [imgSrc, setImgSrc] = React.useState<string | undefined>(
    inView ? undefined : src,
  );
  const [isLoading, setIsLoading] = React.useState(true);

  const handleError = () => {
    if (fallback) {
      setImgSrc(fallback);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Load image only when inView
  React.useEffect(() => {
    if (inView && isInView && !imgSrc) {
      setImgSrc(src);
    }
  }, [inView, isInView, src, imgSrc]);

  // Handle cached images instantly
  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      handleLoad();
    }
  }, [imgSrc]);

  return (
    <AspectRatio ref={ref} ratio={ratio} className={cn('overflow-hidden', AspectRatioClassName)}>
      {/* Skeleton / fallback */}
      <div
        className={cn(
          'absolute inset-0 bg-muted animate-pulse transition-opacity duration-500',
          isLoading ? 'opacity-100' : 'opacity-0',
        )}
      />

      {imgSrc && (
        <img
          ref={imgRef}
          src={imgSrc}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            className,
          )}
        />
      )}
    </AspectRatio>
  );
}
