import React from 'react';

/**
 * SkeletonLoader Component
 * 
 * Displays an animated loading placeholder while widgets are being loaded.
 * Uses a shimmer animation effect for a polished loading experience.
 * 
 * Requirements: 5.9, 15.9, 18.7
 */
export const SkeletonLoader: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
      }}
    >
      {/* Header skeleton */}
      <div
        className="skeleton-item"
        style={{
          width: '60%',
          height: '24px',
          borderRadius: '6px',
          background: 'linear-gradient(90deg, rgba(40, 40, 60, 0.4) 25%, rgba(60, 60, 80, 0.4) 50%, rgba(40, 40, 60, 0.4) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />

      {/* Content skeletons */}
      <div
        className="skeleton-item"
        style={{
          width: '100%',
          height: '40px',
          borderRadius: '6px',
          background: 'linear-gradient(90deg, rgba(40, 40, 60, 0.4) 25%, rgba(60, 60, 80, 0.4) 50%, rgba(40, 40, 60, 0.4) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          animationDelay: '0.1s',
        }}
      />

      <div
        className="skeleton-item"
        style={{
          width: '85%',
          height: '40px',
          borderRadius: '6px',
          background: 'linear-gradient(90deg, rgba(40, 40, 60, 0.4) 25%, rgba(60, 60, 80, 0.4) 50%, rgba(40, 40, 60, 0.4) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          animationDelay: '0.2s',
        }}
      />

      <div
        className="skeleton-item"
        style={{
          width: '95%',
          height: '40px',
          borderRadius: '6px',
          background: 'linear-gradient(90deg, rgba(40, 40, 60, 0.4) 25%, rgba(60, 60, 80, 0.4) 50%, rgba(40, 40, 60, 0.4) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          animationDelay: '0.3s',
        }}
      />

      {/* Large content block skeleton */}
      <div
        className="skeleton-item"
        style={{
          width: '100%',
          flex: 1,
          minHeight: '80px',
          borderRadius: '6px',
          background: 'linear-gradient(90deg, rgba(40, 40, 60, 0.4) 25%, rgba(60, 60, 80, 0.4) 50%, rgba(40, 40, 60, 0.4) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          animationDelay: '0.4s',
        }}
      />

      {/* Inline styles for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * SkeletonCard Component
 * 
 * A smaller skeleton loader for card-like content
 */
export const SkeletonCard: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        background: 'rgba(30, 30, 45, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div
        style={{
          width: '70%',
          height: '16px',
          borderRadius: '4px',
          background: 'linear-gradient(90deg, rgba(40, 40, 60, 0.4) 25%, rgba(60, 60, 80, 0.4) 50%, rgba(40, 40, 60, 0.4) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          marginBottom: '8px',
        }}
      />
      <div
        style={{
          width: '50%',
          height: '14px',
          borderRadius: '4px',
          background: 'linear-gradient(90deg, rgba(40, 40, 60, 0.4) 25%, rgba(60, 60, 80, 0.4) 50%, rgba(40, 40, 60, 0.4) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          animationDelay: '0.1s',
        }}
      />
    </div>
  );
};

/**
 * SkeletonTable Component
 * 
 * A skeleton loader for table-like content
 */
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Table header */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '16px',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, rgba(40, 40, 60, 0.4) 25%, rgba(60, 60, 80, 0.4) 50%, rgba(40, 40, 60, 0.4) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            gap: '8px',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '14px',
                borderRadius: '4px',
                background: 'linear-gradient(90deg, rgba(40, 40, 60, 0.4) 25%, rgba(60, 60, 80, 0.4) 50%, rgba(40, 40, 60, 0.4) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                animationDelay: `${(rowIndex * 3 + i) * 0.05}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
