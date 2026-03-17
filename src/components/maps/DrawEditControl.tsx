'use client';

import { useEffect, useState, type ComponentType } from 'react';

type DrawEditControlProps = {
  position?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
  onCreated?: (e: unknown) => void;
  onEdited?: (e: unknown) => void;
  onDeleted?: (e: unknown) => void;
  draw?: Record<string, unknown>;
};

const runtimeImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<Record<string, unknown>>;

export default function DrawEditControl(props: DrawEditControlProps) {
  const [EditControl, setEditControl] = useState<null | ComponentType<DrawEditControlProps>>(null);

  useEffect(() => {
    runtimeImport('react-leaflet-draw').then((mod) => {
      const component = mod.EditControl as ComponentType<DrawEditControlProps> | undefined;
      if (component) {
        setEditControl(() => component);
      }
    });

    runtimeImport('leaflet-draw/dist/leaflet.draw.css');
  }, []);

  if (!EditControl) {
    return null;
  }

  return <EditControl {...props} />;
}