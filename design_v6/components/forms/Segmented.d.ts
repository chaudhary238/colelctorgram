import type { CSSProperties } from 'react';

export interface SegmentedOption {
  id: string;
  label: string;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  /** Currently selected option id. */
  value: string;
  onChange: (id: string) => void;
  style?: CSSProperties;
}

export declare function Segmented(props: SegmentedProps): JSX.Element;
