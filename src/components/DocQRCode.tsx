/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface DocQRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function DocQRCode({ value, size = 80, className = '' }: DocQRCodeProps) {
  const [svgStr, setSvgStr] = useState<string>('');

  useEffect(() => {
    let active = true;
    
    // Generate standard QR code as raw SVG structure
    QRCode.toString(value, {
      type: 'svg',
      margin: 1, // Minimize margin to maximize scannable area
      color: {
        dark: '#111827', // Deep charcoal/zinc-900 color for high-contrast
        light: '#FFFFFF' // Perfect clean white background
      }
    })
      .then(svg => {
        if (active) {
          // The output from QRCode.toString with type: 'svg' is a raw <svg>...</svg> string
          setSvgStr(svg);
        }
      })
      .catch(err => {
        console.error('Failed to generate high-precision QR Code:', err);
      });

    return () => {
      active = false;
    };
  }, [value]);

  if (!svgStr) {
    // Symmetrical elegant placeholder while rendering
    return (
      <div 
        className={`bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl border border-zinc-200 dark:border-zinc-705 flex-shrink-0 flex items-center justify-center ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <span className="text-[9px] text-zinc-400 font-sans tracking-tight">QR...</span>
      </div>
    );
  }

  // Inject crisp SVG that scales symmetrically
  return (
    <div 
      className={`bg-white p-1 rounded-xl shadow-inner flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      dangerouslySetInnerHTML={{ __html: svgStr }}
    />
  );
}
