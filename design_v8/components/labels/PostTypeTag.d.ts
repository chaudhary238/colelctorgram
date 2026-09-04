export interface PostTypeTagProps {
  /** Post classification. Default fallback: 'post'. */
  type: 'post' | 'showcase' | 'discussion' | 'review' | 'poll' | 'iso';
}

export declare function PostTypeTag(props: PostTypeTagProps): JSX.Element;
