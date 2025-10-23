import React from 'react';

const Textarea = React.forwardRef(({
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled = false,
  required = false,
  readOnly = false,
  className = '',
  size = 'md',
  placeholder,
  rows = 4,
  resize = true,
  success = false,
  fullWidth = true,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const baseClasses = "border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 bg-white";
  
  const stateClasses = error 
    ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
    : success 
    ? "border-green-500 focus:border-green-500 focus:ring-green-500"
    : "border-gray-300 focus:border-primary-500";
  
  const disabledClasses = disabled || readOnly
    ? "bg-gray-100 cursor-not-allowed opacity-60" 
    : "bg-white";
  
  const resizeClass = resize ? "resize-y" : "resize-none";
  
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className={`
          ${baseClasses}
          ${sizeClasses[size]}
          ${stateClasses}
          ${disabledClasses}
          ${resizeClass}
          ${widthClass}
          placeholder-gray-400
          ${readOnly ? 'cursor-default' : ''}
        `}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;