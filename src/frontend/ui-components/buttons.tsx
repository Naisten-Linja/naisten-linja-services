import React from 'react';

interface ButtonProps {
  type?: 'primary' | 'secondary' | 'tertiary';
  className?: string;
  onClick?: () => any;
}

export const Button: React.FunctionComponent<ButtonProps> = ({
  children,
  type = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button {...props} className={`button button-${type} ${className}`}>
      {children}
    </button>
  );
};

export const ButtonSmall: React.FunctionComponent<ButtonProps> = ({
  children,
  type = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button {...props} className={`button button-${type} button-xs ${className}`}>
      {children}
    </button>
  );
};

export const ButtonText: React.FunctionComponent<ButtonProps> = ({
  children,
  type = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button {...props} className={`button button-${type} button-text ${className}`}>
      {children}
    </button>
  );
};

export const ButtonTextSmall: React.FunctionComponent<ButtonProps> = ({
  children,
  type = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button {...props} className={`button button-${type} button-xs button-text ${className}`}>
      {children}
    </button>
  );
};
