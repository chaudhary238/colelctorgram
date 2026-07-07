import type { CSSProperties } from 'react';

export interface AvatarProps {
  /** Display name — first character used as the initial fallback. */
  name?: string;
  /** Override background colour. Accepts any CSS colour or token reference. Defaults to a deterministic brand palette pick. */
  color?: string;
  /** Diameter in px. Default: 36. */
  size?: number;
  /** When true shows a verified teal badge on the bottom-right. */
  verified?: boolean;
  /** If provided, renders as a background-image crop instead of the initial. */
  photo?: string;
}

export declare function Avatar(props: AvatarProps): JSX.Element;
