import type { ReactNode } from 'react';

export interface CategoryChipProps {
  /** Whether this chip is currently selected. */
  active?: boolean;
  children?: ReactNode;
  onClick?: () => void;
}

export declare function CategoryChip(props: CategoryChipProps): JSX.Element;
