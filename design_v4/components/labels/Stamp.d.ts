import type { CSSProperties, ReactNode } from 'react';

export interface StampProps {
  children?: ReactNode;
  /** Fill colour. Default: 'var(--stamp-red)'. */
  color?: string;
  /** Rotation in degrees. Default: 2. */
  rotate?: number;
  style?: CSSProperties;
}

export declare function Stamp(props: StampProps): JSX.Element;
