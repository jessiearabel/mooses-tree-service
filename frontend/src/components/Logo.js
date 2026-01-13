import React from 'react';

const Logo = ({ className = "w-6 h-6", alt = "Moose Logo" }) => {
  const isDashboard = className.includes('w-12 h-12');
  
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
        transform: isDashboard ? 'scale(1.0)' : 'scale(0.4)'
      }}
    />
  );
};

export default Logo;