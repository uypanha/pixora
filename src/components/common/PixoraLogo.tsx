import React from 'react';

interface PixoraLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const PixoraLogo: React.FC<PixoraLogoProps> = ({
  size = 24,
  className = '',
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      width={size}
      height={size}
      className={className}
      {...props}
    >
      <rect width="40" height="40" rx="10" fill="#4F46E5" />
      <rect x="9" y="9" width="13" height="13" rx="3" fill="#EEF2FF" fillOpacity="0.95" />
      <circle cx="25" cy="15" r="4.5" fill="#C7D2FE" />
      <path
        d="M11 28C11 25.7909 12.7909 24 15 24H27C29.2091 24 31 25.7909 31 28V29C31 30.1046 30.1046 31 29 31H13C11.8954 31 11 30.1046 11 29V28Z"
        fill="#FFFFFF"
      />
      <path d="M19 24L23 18L27 24H19Z" fill="#6366F1" fillOpacity="0.4" />
    </svg>
  );
};
