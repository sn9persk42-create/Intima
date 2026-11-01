import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const IntimaLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
}) => {
  const heightStyles = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12',
    lg: 'h-16 sm:h-20',
  };

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <img
        src="/assets/aistudio/c5b91431cecff13bc2a6e3d846bc86a57776e1d720d0f00fd4ce5d1772be584b__1__e66f4434.png"
        alt="INTIMA — Relations, Amour & Émotions"
        className={`${heightStyles[size]} w-auto object-contain drop-shadow-xs`}
        loading="eager"
      />
    </div>
  );
};
