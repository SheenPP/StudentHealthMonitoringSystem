"use client";

import Image from "next/image";

type SupabaseImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
};

const SupabaseImage = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  onClick,
}: SupabaseImageProps) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      priority={priority}
      className={className}
      onClick={onClick}
    />
  );
};

export default SupabaseImage;
