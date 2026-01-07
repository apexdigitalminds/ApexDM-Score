"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { AccountIcon } from './icons';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  frameColor?: string; // Color for the frame border
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, className, frameColor }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUrl = async () => {
      setIsLoading(true);
      setImageUrl(null);

      if (!src) {
        setIsLoading(false);
        return;
      }

      if (src.startsWith('http')) {
        setImageUrl(src);
        setIsLoading(false);
      } else {
        const { data, error } = await supabase.storage
          .from('avatars')
          .createSignedUrl(src, 3600);

        if (error) {
          console.error('Error creating signed URL for avatar:', error.message);
          setImageUrl(null);
        } else {
          setImageUrl(data.signedUrl);
        }
        setIsLoading(false);
      }
    };

    getUrl();
  }, [src]);

  // Frame wrapper styles
  const frameStyle = frameColor ? {
    boxShadow: `0 0 0 4px ${frameColor}, 0 0 20px ${frameColor}40`,
    border: `3px solid ${frameColor}`,
  } : {};

  // Render a loading/placeholder state
  if (isLoading || !imageUrl) {
    return (
      <div
        className={`${className} bg-slate-700 flex items-center justify-center`}
        style={frameStyle}
      >
        <AccountIcon className="w-full h-full text-slate-500 p-1" />
      </div>
    );
  }

  // Render the image with optional frame
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={frameStyle}
      onError={() => setImageUrl(null)}
    />
  );
};

export default Avatar;