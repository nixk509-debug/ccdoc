import type { BuilderBlock } from './types';

export interface BlockLocation {
  path: number[];
  block: BuilderBlock;
  parent?: BuilderBlock;
}

export function cloneBlocks<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function walkBlocks(blocks: BuilderBlock[], parent?: BuilderBlock, path: number[] = []): BlockLocation[] {
  return blocks.flatMap((block, index) => {
    const nextPath = [...path, index];
    const current: BlockLocation = { path: nextPath, block, parent };
    const children = block.children?.length ? walkBlocks(block.children, block, nextPath) : [];
    return [current, ...children];
  });
}

export function getBlockAtPath(blocks: BuilderBlock[], path: number[]): BuilderBlock | undefined {
  let currentBlocks = blocks;
  let current: BuilderBlock | undefined;
  for (const index of path) {
    current = currentBlocks[index];
    if (!current) return undefined;
    currentBlocks = current.children || [];
  }
  return current;
}

export function updateBlocksAtPath(blocks: BuilderBlock[], path: number[], updater: (blocks: BuilderBlock[], index: number) => void) {
  const target = path[path.length - 1];
  const parentPath = path.slice(0, -1);
  const parent = parentPath.length ? getBlockAtPath(blocks, parentPath) : undefined;
  const list = parent ? (parent.children = parent.children || []) : blocks;
  updater(list, target);
}

export function removeBlockAtPath(blocks: BuilderBlock[], path: number[]) {
  updateBlocksAtPath(blocks, path, (list, index) => {
    list.splice(index, 1);
  });
}

export function insertBlockAtPath(blocks: BuilderBlock[], path: number[], block: BuilderBlock, position: 'before' | 'after' | 'inside' = 'after') {
  if (position === 'inside') {
    const parent = getBlockAtPath(blocks, path);
    if (!parent) return;
    parent.children = parent.children || [];
    parent.children.push(block);
    return;
  }

  updateBlocksAtPath(blocks, path, (list, index) => {
    list.splice(position === 'before' ? index : index + 1, 0, block);
  });
}

export function moveBlockAtPath(blocks: BuilderBlock[], path: number[], direction: -1 | 1) {
  updateBlocksAtPath(blocks, path, (list, index) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= list.length) return;
    const [item] = list.splice(index, 1);
    list.splice(nextIndex, 0, item);
  });
}
