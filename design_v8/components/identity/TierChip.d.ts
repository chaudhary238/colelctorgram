export interface TierChipProps {
  /** Trust tier label. Renders null for unrecognised or undefined values. */
  tier?: 'Top Seller' | 'Trusted' | 'Verified' | string;
}

export declare function TierChip(props: TierChipProps): JSX.Element | null;
