import type { CSSProperties, ReactNode } from 'react';

export interface BadgeProps {
  /** Colour theme. Default: 'default' (stamp-red fill). */
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'teal' | 'plum' | 'dark';
  children?: ReactNode;
  style?: CSSProperties;
}

export declare function Badge(props: BadgeProps): JSX.Element;
