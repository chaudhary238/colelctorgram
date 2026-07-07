import type { CSSProperties, ReactNode, ChangeEvent } from 'react';

export interface InputProps {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Called when the user presses Enter. */
  onSubmit?: () => void;
  placeholder?: string;
  type?: string;
  /** Optional leading icon node (SVG). */
  icon?: ReactNode;
  disabled?: boolean;
  style?: CSSProperties;
}

export declare function Input(props: InputProps): JSX.Element;
