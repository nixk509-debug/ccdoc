export type BuilderMode = 'embed' | 'components';

export type BlockType =
  | 'title'
  | 'description'
  | 'color'
  | 'author'
  | 'thumbnail'
  | 'image'
  | 'field'
  | 'footer'
  | 'timestamp'
  | 'button'
  | 'select'
  | 'container'
  | 'section'
  | 'separator'
  | 'text'
  | 'gallery'
  | 'file'
  | 'action-row';

export interface ChoiceOption {
  id: string;
  label: string;
  value: string;
  note?: string;
}

export interface BuilderBlock {
  id: string;
  type: BlockType;
  label: string;
  helper: string;
  collapsed?: boolean;
  settings: Record<string, any>;
  children?: BuilderBlock[];
}

export interface BuilderDocument {
  id: string;
  name: string;
  mode: BuilderMode;
  summary: string;
  blocks: BuilderBlock[];
}

export interface LibraryItem {
  type: BlockType;
  label: string;
  helper: string;
}
