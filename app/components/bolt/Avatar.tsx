"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase'; // FIX: Corrected import path
import { AccountIcon } from './icons';

interface AvatarProps {
  src: string | null | undefined; // Can be a full URL (e.g., from Dicebear) or a path (from Supabase Storage)
  alt: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, className }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect handles fetching the correct, usable URL for the image.
    const getUrl = async () => {
      setIsLoading(true);
      setImageUrl(null);

      if (!src) {
        setIsLoading(false);
        return;
      }

      // If 'src' is a full URL (like from Dicebear), use it directly.
      if (src.startsWith('http')) {
        setImageUrl(src);
        setIsLoading(false);
      } else {
        // Otherwise, assume 'src' is a file path and create a temporary signed URL.
        // This is the correct and secure way to display images from a private bucket.
        const { data, error } = await supabase.storage
          .from('avatars')
          .createSignedUrl(src, 3600); // URL is valid for 1 hour

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
  }, [src]); // Re-run whenever the src path/url changes

  // Render a loading/placeholder state while fetching the signed URL
  if (isLoading || !imageUrl) {
    return (
      <div className={`${className} bg-slate-700 flex items-center justify-center`}>
        <AccountIcon className="w-full h-full text-slate-500 p-1" />
      </div>
    );
  }

  // Render the image with the fetched URL
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      // If the signed URL itself fails (e.g., expires, permissions issue), fall back to the icon.
      onError={() => setImageUrl(null)} 
    />
  );
};

export default Avatar;