import React, { useState } from 'react';
import { EnhancedImageModal } from '@/components/ui/EnhancedImageModal';

export default function TestModalPage() {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ minHeight: '100vh', background: '#222', color: '#fff', padding: 40 }}>
      <button onClick={() => setOpen(true)} style={{ marginBottom: 20, padding: 10, fontSize: 18 }}>
        Open Modal
      </button>
      <EnhancedImageModal
        isOpen={open}
        onClose={() => setOpen(false)}
        images={[
          {
            url: 'https://via.placeholder.com/300',
            alt: 'Test',
            title: 'Test',
            description: 'Test image for modal.'
          }
        ]}
      />
    </div>
  );
} 