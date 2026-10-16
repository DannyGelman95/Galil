import { useBrandColors } from '../lib/ThemeModeContext';

export default function GalilLogo({ size = 32 }) {
  const brand = useBrandColors();
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" aria-hidden="true">
      <path
        d="M78 34H42a10 10 0 00-10 10v152a10 10 0 0010 10h36"
        fill="none"
        stroke={brand.forest}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M162 34h36a10 10 0 0110 10v152a10 10 0 01-10 10h-36"
        fill="none"
        stroke={brand.forest}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M148 92A44 44 0 10152 148V122H122"
        fill="none"
        stroke={brand.green}
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
