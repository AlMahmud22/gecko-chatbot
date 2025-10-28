function Button({ children, variant = 'primary', size = 'md', className = '', disabled, ...props }) {
  const variants = {
    primary: 'bg-green-700 hover:bg-green-800 text-white',
    secondary: 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-[#2a2a2a] text-gray-300 hover:text-white',
  };

  const sizes = {
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  };

  return (
    <button
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg
        font-medium
        transition-colors
        focus:outline-none
        focus:ring-2
        focus:ring-green-600
        focus:ring-offset-2
        focus:ring-offset-[#1a1a1a]
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;