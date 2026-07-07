import type { CSSProperties, ReactNode } from 'react';

export interface IconButtonProps {
  /** SVG icon node to render inside the button. */
  icon: ReactNode;
  onClick?: () => void;
  /** When true renders with filled dark background. */
  active?: boolean;
  /** Numeric badge overlaid top-right (e.g. unread count). */
  badge?: number | string | null;
  /** Button size in px. Default: 40. */
  size?: number;
  /** Border radius in px. Default: 13. */
  radius?: number;
  style?: CSSProperties;
}

export declare function IconButton(props: IconButtonProps): JSX.Element;
