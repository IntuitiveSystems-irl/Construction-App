/**
 * React Signature Canvas Component
 * Supports both mouse and touch input for signature collection
 */

import React, { useRef, useState, useEffect } from 'react';

export interface SignatureCanvasProps {
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;
  onSave?: (signatureData: string) => void;
  onClear?: () => void;
  className?: string;
  showControls?: boolean;
  clearButtonText?: string;
  saveButtonText?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  width = 600,
  height = 200,
  strokeColor = '#000000',
  strokeWidth = 2,
  backgroundColor = '#ffffff',
  onSave,
  onClear,
  className = '',
  showControls = true,
  clearButtonText = 'Clear',
  saveButtonText = 'Save Signature'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Set drawing style
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height, strokeColor, strokeWidth, backgroundColor]);

  // Get coordinates from mouse or touch event
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      // Touch event
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      // Touch end event
      const touch = e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else if ('clientX' in e) {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    return { x: 0, y: 0 };
  };

  // Start drawing
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDrawing(true);
    setHasDrawn(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  // Draw
  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = (
    e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDrawing(false);
  };

  // Clear signature
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and reset background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    setHasDrawn(false);

    if (onClear) {
      onClear();
    }
  };

  // Save signature
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasDrawn) {
      alert('Please provide a signature first');
      return;
    }

    const signatureData = canvas.toDataURL('image/png');

    if (onSave) {
      onSave(signatureData);
    }
  };

  return (
    <div className={`signature-canvas-container ${className}`}>
      <div style={{ border: '2px solid #ccc', borderRadius: '4px', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ 
            cursor: 'crosshair',
            touchAction: 'none',
            display: 'block'
          }}
        />
      </div>

      {showControls && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={handleClear}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {clearButtonText}
          </button>
          <button
            onClick={handleSave}
            disabled={!hasDrawn}
            style={{
              padding: '8px 16px',
              backgroundColor: hasDrawn ? '#10b981' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: hasDrawn ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            {saveButtonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default SignatureCanvas;
