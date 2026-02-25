/**
 * Reusable "Most popular" (or any label) tag badge.
 * Light blue background, teal text, small pill.
 */
export default function PopularTag({ children = 'Most popular', className = '', style = {} }) {
  return (
    <span
      className={`text-a5 font-display whitespace-nowrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 4px',
        borderRadius: '1px',
        backgroundColor: '#BEF9FF',
        color: '#2396A3',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
