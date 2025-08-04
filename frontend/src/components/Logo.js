import React from 'react';

const Logo = ({ className = "w-6 h-6", alt = "Tree Pro Logo" }) => {
  return (
    <img 
      src="https://customer-assets.emergentagent.com/job_treepro-study/artifacts/pm2mnnoa_moose-Photoroom.jpg"
      alt={alt}
      className={className}
      style={{
        objectFit: 'contain',
        filter: 'brightness(0) invert(1)'  // Make it white like the original TreePine icon
      }}
    />
  );
};

export default Logo;