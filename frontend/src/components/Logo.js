import React from 'react';

const Logo = ({ className = "w-6 h-6", alt = "Moose Logo" }) => {
  const isDashboardAvatar = className.includes('w-6 h-6') && className !== "w-6 h-6"; // Dashboard specific
  const isHeaderSmall = className.includes('w-4 h-4');
  
  let scale = 'scale(0.4)'; // Default small scale
  
  if (isDashboardAvatar) {
    scale = 'scale(0.6)'; // Small avatar size in dashboard
  } else if (isHeaderSmall) {
    scale = 'scale(0.4)'; // Small header size
  } else if (className.includes('w-6 h-6')) {
    scale = 'scale(0.7)'; // Dashboard avatar
  }
  
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
        transform: scale
      }}
    />
  );
};

export default Logo;