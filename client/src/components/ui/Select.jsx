import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({
  label,
  value,
  onChange,
  onBlur,
  options,
  children,
  error,
  disabled = false,
  required = false,
  className = '',
  size = 'md',
  placeholder,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-4 py-3 text-lg'
  };

  const baseClasses = "w-full border rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 appearance-none bg-white";
  
  const stateClasses = error 
    ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
    : "border-gray-300";
  
  const disabledClasses = disabled 
    ? "bg-gray-100 cursor-not-allowed opacity-60" 
    : "cursor-pointer";

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={`
            ${baseClasses}
            ${sizeClasses[size]}
            ${stateClasses}
            ${disabledClasses}
            pr-10
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options ? (
            options.map((option) => (
              <option 
                key={option.value || option} 
                value={option.value || option}
                disabled={option.disabled}
              >
                {option.label || option}
              </option>
            ))
          ) : (
            children
          )}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 ${disabled ? 'opacity-50' : ''}`} 
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;