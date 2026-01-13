import React from 'react';

const Logo = ({ className = "w-6 h-6", alt = "Moose Logo", white = false }) => {
  return (
    <img 
      src="https://customer-assets.emergentagent.com/job_exam-tree-prep/artifacts/ptj20kfe_moose.png"
      alt={alt}
      className={className}
      style={{
        objectFit: 'cover',
        borderRadius: '50%',
        width: '100%',
        height: '100%',
        transform: 'scale(1.2)',
        // Apply white filter only when specifically requested (like in header)
        filter: white ? 'brightness(0) invert(1)' : 'none'
      }}
    />
  );
};

export default Logo;