import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface FancyQRCodeProps {
  value: string;
  size?: number;
}

export const FancyQRCode = ({ value, size = 140 }: FancyQRCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateFancyQR = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size with device pixel ratio for sharpness
      const scale = window.devicePixelRatio || 1;
      canvas.width = size * scale;
      canvas.height = size * scale;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(scale, scale);

      // Generate QR code data
      const qrCanvas = document.createElement("canvas");
      await QRCode.toCanvas(qrCanvas, value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: "H", // High error correction for logo overlay
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // Draw white background with rounded corners
      const radius = 12;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fill();

      // Draw QR code
      ctx.drawImage(qrCanvas, 0, 0, size, size);

      // Get QR code image data to identify modules
      const imageData = ctx.getImageData(0, 0, size * scale, size * scale);
      
      // Clear and redraw with fancy styling
      ctx.clearRect(0, 0, size, size);
      
      // Draw background again
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fill();

      // Draw gradient border
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, "hsl(262, 83%, 58%)"); // Primary purple
      gradient.addColorStop(0.5, "hsl(280, 80%, 55%)");
      gradient.addColorStop(1, "hsl(262, 83%, 58%)");
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(size - radius, 0);
      ctx.quadraticCurveTo(size, 0, size, radius);
      ctx.lineTo(size, size - radius);
      ctx.quadraticCurveTo(size, size, size - radius, size);
      ctx.lineTo(radius, size);
      ctx.quadraticCurveTo(0, size, 0, size - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.stroke();

      // Redraw QR code with rounded modules
      await QRCode.toCanvas(qrCanvas, value, {
        width: size - 16,
        margin: 1,
        errorCorrectionLevel: "H",
        color: {
          dark: "#1a1a2e",
          light: "#ffffff",
        },
      });
      
      ctx.drawImage(qrCanvas, 8, 8, size - 16, size - 16);

      // Draw center logo/icon area
      const centerSize = size * 0.22;
      const centerX = (size - centerSize) / 2;
      const centerY = (size - centerSize) / 2;
      
      // White background for center
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, centerSize / 2 + 4, 0, Math.PI * 2);
      ctx.fill();

      // Gradient circle
      const centerGradient = ctx.createLinearGradient(
        centerX, centerY, 
        centerX + centerSize, centerY + centerSize
      );
      centerGradient.addColorStop(0, "hsl(262, 83%, 58%)");
      centerGradient.addColorStop(1, "hsl(280, 80%, 50%)");
      
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, centerSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw clipboard icon in center
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      
      const iconSize = centerSize * 0.5;
      const iconX = size / 2 - iconSize / 2;
      const iconY = size / 2 - iconSize / 2;
      
      // Clipboard body
      const clipRadius = 3;
      ctx.beginPath();
      ctx.moveTo(iconX + clipRadius, iconY + iconSize * 0.15);
      ctx.lineTo(iconX + iconSize - clipRadius, iconY + iconSize * 0.15);
      ctx.quadraticCurveTo(iconX + iconSize, iconY + iconSize * 0.15, iconX + iconSize, iconY + iconSize * 0.15 + clipRadius);
      ctx.lineTo(iconX + iconSize, iconY + iconSize - clipRadius);
      ctx.quadraticCurveTo(iconX + iconSize, iconY + iconSize, iconX + iconSize - clipRadius, iconY + iconSize);
      ctx.lineTo(iconX + clipRadius, iconY + iconSize);
      ctx.quadraticCurveTo(iconX, iconY + iconSize, iconX, iconY + iconSize - clipRadius);
      ctx.lineTo(iconX, iconY + iconSize * 0.15 + clipRadius);
      ctx.quadraticCurveTo(iconX, iconY + iconSize * 0.15, iconX + clipRadius, iconY + iconSize * 0.15);
      ctx.closePath();
      ctx.stroke();

      // Clipboard clip
      ctx.beginPath();
      ctx.moveTo(iconX + iconSize * 0.3, iconY + iconSize * 0.15);
      ctx.lineTo(iconX + iconSize * 0.3, iconY + iconSize * 0.05);
      ctx.quadraticCurveTo(iconX + iconSize * 0.3, iconY, iconX + iconSize * 0.4, iconY);
      ctx.lineTo(iconX + iconSize * 0.6, iconY);
      ctx.quadraticCurveTo(iconX + iconSize * 0.7, iconY, iconX + iconSize * 0.7, iconY + iconSize * 0.05);
      ctx.lineTo(iconX + iconSize * 0.7, iconY + iconSize * 0.15);
      ctx.stroke();
    };

    generateFancyQR();
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl shadow-lg"
      style={{ width: size, height: size }}
    />
  );
};
