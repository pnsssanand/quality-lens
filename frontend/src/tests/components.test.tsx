import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../components/common/KPICard';
import { CloudinaryService } from '../services/cloudinaryService';
import { Activity } from 'lucide-react';

describe('Frontend Component Tests', () => {
  it('renders KPICard correctly with title, value, and badge', () => {
    render(
      <KPICard
        title="Overall Defect Rate"
        value="1.85%"
        subtitle="Process Normal"
        icon={Activity}
        badge="NORMAL"
        badgeColor="emerald"
      />
    );

    expect(screen.getByText('Overall Defect Rate')).toBeInTheDocument();
    expect(screen.getByText('1.85%')).toBeInTheDocument();
    expect(screen.getByText('NORMAL')).toBeInTheDocument();
    expect(screen.getByText('Process Normal')).toBeInTheDocument();
  });

  it('validates image file format and file size in CloudinaryService', () => {
    // Valid image file
    const validFile = new File(['dummy image content'], 'scratch_sample.jpg', {
      type: 'image/jpeg',
    });
    const validRes = CloudinaryService.validateImage(validFile);
    expect(validRes.valid).toBe(true);

    // Invalid file format (e.g. executable/text)
    const invalidFile = new File(['executable binary'], 'malicious.exe', {
      type: 'application/x-msdownload',
    });
    const invalidRes = CloudinaryService.validateImage(invalidFile);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.error).toContain('Invalid file format');
  });
});
