import React from 'react';

interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  buttonType?: 'primary' | 'secondary' | 'tertiary';
}

export const Button: React.FunctionComponent<ButtonProps> = ({
  children,
  buttonType = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button {...props} className={`button button-${buttonType} ${className}`}>
      {children}
    </button>
  );
};

export const ButtonSmall: React.FunctionComponent<ButtonProps> = ({
  children,
  buttonType = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button {...props} className={`button button-${buttonType} button-xs ${className}`}>
      {children}
    </button>
  );
};

export const ButtonText: React.FunctionComponent<ButtonProps> = ({
  children,
  buttonType = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button {...props} className={`button button-${buttonType} button-text ${className}`}>
      {children}
    </button>
  );
};

export const ButtonTextSmall: React.FunctionComponent<ButtonProps> = ({
  children,
  buttonType = 'primary',
  className = '',
  ...props
}) => {
  return (
    <button {...props} className={`button button-${buttonType} button-xs button-text ${className}`}>
      {children}
    </button>
  );
};
