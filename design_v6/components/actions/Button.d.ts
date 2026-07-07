import type { CSSProperties, ReactNode } from 'react';

export interface ButtonProps {
  /** Visual style variant. Default: 'primary'. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'teal' | 'grail' | 'destructive';
  /** Size preset. 'block' stretches to full container width. Default: 'md'. */
  size?: 'sm' | 'md' | 'lg' | 'block';
  /** Leading icon node (rendered before children). */
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  disabled?: boolean;
}

export declare function Button(props: ButtonProps): JSX.Element;
