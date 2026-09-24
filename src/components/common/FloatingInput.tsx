import React, { useState } from "react";

interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
  rightIcon?: React.ReactNode;
  inputClassName?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  error?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  rightIcon,
  inputClassName,
  inputProps,
  error,
}) => {
  const [focused, setFocused] = useState(false);

  const showLabel = focused || value.length > 0;

  return (
    <fieldset
      className={`
    relative w-full
    rounded-lg border
    px-3 py-2
    focus-within:ring-2
    ${error ? "border-red-500 focus-within:ring-red-500" : "border-blue-600 focus-within:ring-blue-700"}
  `}
    >
      {showLabel && (
        <legend
          className="
            px-2 text-xs font-semibold text-blue-700
            bg-white relative -top-1
            transition-all duration-200
          "
        >
          {label}
        </legend>
      )}

      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={showLabel ? "" : label}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          if (!value) setFocused(false);
        }}
        className={`w-full bg-transparent outline-none text-sm ${
          inputClassName || ""
        }`}
        {...inputProps}
      />

      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightIcon}
        </div>
      )}
    </fieldset>
  );
};
