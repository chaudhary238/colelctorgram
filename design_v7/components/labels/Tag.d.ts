import type { CSSProperties, ReactNode } from 'react';

export interface TagProps {
  /** Semantic kind — drives background + text colour automatically. Default: 'default'. */
  kind?: 'sale' | 'po' | 'misb' | 'sold' | 'reserved' | 'vouch' | 'event' | 'default';
  children?: ReactNode;
  style?: CSSProperties;
}

export declare function Tag(props: TagProps): JSX.Element;
