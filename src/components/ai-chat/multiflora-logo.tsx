"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type MultiFloraBrandLogoProps = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  xs: 28,
  sm: 36,
  md: 88,
  lg: 180,
};

export function MultiFloraBrandLogo({ size = "md", className }: MultiFloraBrandLogoProps) {
  const px = sizes[size];
  const [src, setSrc] = useState("/multiflora-logo.png");

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full ring-1 ring-[#e5e7eb]",
        size === "lg" && "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
        className
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src={src}
        alt="MultiFlora"
        width={px}
        height={px}
        priority={size === "lg"}
        className="h-full w-full object-cover"
        onError={() => setSrc("/multiflora-logo.svg")}
      />
    </div>
  );
}
