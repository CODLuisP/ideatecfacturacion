"use client";
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './Button';
import { Modal } from './Modal';
import { LayoutGrid, RectangleHorizontal, RectangleVertical, Check, X } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface LogoCropperProps {
  image: string;
  onCropComplete: (croppedImage: string, file: File) => void;
  onCancel: () => void;
}

type AspectRatio = {
  label: string;
  value: number;
  icon: React.ElementType;
  id: 'square' | 'rect' | 'vertical';
  width: number;
  height: number;
};

const ASPECT_RATIOS: AspectRatio[] = [
  { id: 'square', label: 'Cuadrado', value: 1, icon: LayoutGrid, width: 400, height: 400 },
  { id: 'rect', label: 'Rectangular', value: 2 / 1, icon: RectangleHorizontal, width: 800, height: 400 },
  { id: 'vertical', label: 'Vertical', value: 2 / 3, icon: RectangleVertical, width: 400, height: 600 },
];

export function LogoCropper({ image, onCropComplete, onCancel }: LogoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onCropCompleteCallback = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    targetWidth: number,
    targetHeight: number
  ): Promise<{ base64: string; file: File }> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to the target dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Draw the cropped portion of the source image onto the canvas, resizing it to the target dimensions
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], 'logo.png', { type: 'image/png' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve({ base64: reader.result as string, file });
        };
      }, 'image/png');
    });
  };

  const handleDone = async () => {
    try {
      const { base64, file } = await getCroppedImg(
        image,
        croppedAreaPixels,
        selectedRatio.width,
        selectedRatio.height
      );
      onCropComplete(base64, file);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title="Ajustar Logo">
      <div className="space-y-6">
        <div className="relative h-80 w-full bg-gray-900 rounded-xl overflow-hidden border border-gray-100">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={selectedRatio.value}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 block">
              Tipo de Formato
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => setSelectedRatio(ratio)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-2",
                    selectedRatio.id === ratio.id
                      ? "border-brand-blue bg-blue-50 text-brand-blue ring-1 ring-brand-blue"
                      : "border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <ratio.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{ratio.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wide">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              <X className="w-4 h-4" /> Cancelar
            </Button>
            <Button type="button" className="flex-1" onClick={handleDone}>
              <Check className="w-4 h-4" /> Aplicar Recorte
            </Button>
          </div>
          
          <p className="text-[10px] text-gray-400 text-center italic">
            El logo se redimensionará automáticamente a {selectedRatio.width}x{selectedRatio.height}px para mantener la consistencia.
          </p>
        </div>
      </div>
    </Modal>
  );
}
