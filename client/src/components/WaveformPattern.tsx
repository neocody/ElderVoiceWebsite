interface WaveformPatternProps {
  className?: string;
  variant?: 'subtle' | 'accent';
}

export function WaveformPattern({ className = "", variant = 'subtle' }: WaveformPatternProps) {
  const opacity = variant === 'subtle' ? '0.1' : '0.2';
  const color = variant === 'subtle' ? '#2962EB' : '#4E48E6';

  return (
    <svg 
      className={`absolute pointer-events-none ${className}`}
      width="100%" 
      height="60" 
      viewBox="0 0 400 60" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Animated waveform bars */}
      <g opacity={opacity}>
        {/* First wave pattern */}
        <rect x="10" y="25" width="2" height="10" fill={color} rx="1">
          <animate attributeName="height" values="10;20;15;10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="y" values="25;20;22.5;25" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="16" y="20" width="2" height="20" fill={color} rx="1">
          <animate attributeName="height" values="20;8;25;20" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="y" values="20;26;17.5;20" dur="2.2s" repeatCount="indefinite" />
        </rect>
        <rect x="22" y="28" width="2" height="4" fill={color} rx="1">
          <animate attributeName="height" values="4;18;6;4" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="y" values="28;21;27;28" dur="1.8s" repeatCount="indefinite" />
        </rect>
        <rect x="28" y="22" width="2" height="16" fill={color} rx="1">
          <animate attributeName="height" values="16;12;22;16" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="y" values="22;24;19;22" dur="2.5s" repeatCount="indefinite" />
        </rect>
        <rect x="34" y="26" width="2" height="8" fill={color} rx="1">
          <animate attributeName="height" values="8;24;10;8" dur="1.9s" repeatCount="indefinite" />
          <animate attributeName="y" values="26;18;25;26" dur="1.9s" repeatCount="indefinite" />
        </rect>

        {/* Second wave pattern - offset */}
        <rect x="50" y="24" width="2" height="12" fill={color} rx="1">
          <animate attributeName="height" values="12;18;8;12" dur="2.1s" repeatCount="indefinite" begin="0.3s" />
          <animate attributeName="y" values="24;21;28;24" dur="2.1s" repeatCount="indefinite" begin="0.3s" />
        </rect>
        <rect x="56" y="27" width="2" height="6" fill={color} rx="1">
          <animate attributeName="height" values="6;22;4;6" dur="2.4s" repeatCount="indefinite" begin="0.3s" />
          <animate attributeName="y" values="27;19;28;27" dur="2.4s" repeatCount="indefinite" begin="0.3s" />
        </rect>
        <rect x="62" y="19" width="2" height="22" fill={color} rx="1">
          <animate attributeName="height" values="22;14;26;22" dur="1.7s" repeatCount="indefinite" begin="0.3s" />
          <animate attributeName="y" values="19;23;17;19" dur="1.7s" repeatCount="indefinite" begin="0.3s" />
        </rect>
        <rect x="68" y="25" width="2" height="10" fill={color} rx="1">
          <animate attributeName="height" values="10;16;12;10" dur="2.3s" repeatCount="indefinite" begin="0.3s" />
          <animate attributeName="y" values="25;22;24;25" dur="2.3s" repeatCount="indefinite" begin="0.3s" />
        </rect>

        {/* Third wave pattern - more offset */}
        <rect x="350" y="23" width="2" height="14" fill={color} rx="1">
          <animate attributeName="height" values="14;20;10;14" dur="2.0s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="y" values="23;20;25;23" dur="2.0s" repeatCount="indefinite" begin="0.6s" />
        </rect>
        <rect x="356" y="26" width="2" height="8" fill={color} rx="1">
          <animate attributeName="height" values="8;24;6;8" dur="2.2s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="y" values="26;18;27;26" dur="2.2s" repeatCount="indefinite" begin="0.6s" />
        </rect>
        <rect x="362" y="21" width="2" height="18" fill={color} rx="1">
          <animate attributeName="height" values="18;12;22;18" dur="1.9s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="y" values="21;24;19;21" dur="1.9s" repeatCount="indefinite" begin="0.6s" />
        </rect>
        <rect x="368" y="28" width="2" height="4" fill={color} rx="1">
          <animate attributeName="height" values="4;16;8;4" dur="2.1s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="y" values="28;22;26;28" dur="2.1s" repeatCount="indefinite" begin="0.6s" />
        </rect>
        <rect x="374" y="24" width="2" height="12" fill={color} rx="1">
          <animate attributeName="height" values="12;18;14;12" dur="2.4s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="y" values="24;21;23;24" dur="2.4s" repeatCount="indefinite" begin="0.6s" />
        </rect>
      </g>
    </svg>
  );
}