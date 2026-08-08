import { useState } from "react";
import type { FileNode } from "@/types/repository";

interface TreeRowProps {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (node: FileNode) => void;
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-accent-400" fill="currentColor">
      {open ? (
        <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H8.31l-1.4-1.4A1.5 1.5 0 0 0 5.85 2.5H1.5Z" />
      ) : (
        <path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14.5 4H8.31L6.7 2.4A1.5 1.5 0 0 0 5.65 2H1.5Z" />
      )}
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-text-muted" fill="currentColor">
      <path d="M4 1.5A1.5 1.5 0 0 1 5.5 0h3.879a1.5 1.5 0 0 1 1.06.44l2.622 2.62a1.5 1.5 0 0 1 .439 1.061V14.5A1.5 1.5 0 0 1 12 16H5.5A1.5 1.5 0 0 1 4 14.5v-13Z" />
    </svg>
  );
}

function TreeRow({ node, depth, selectedPath, onSelectFile }: TreeRowProps) {
  const [expanded, setExpanded] = useState(depth < 1);

  const isFolder = node.type === "folder";
  const isSelected = node.path === selectedPath;

  function handleClick() {
    if (isFolder) {
      setExpanded((prev) => !prev);
    } else {
      onSelectFile(node);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`flex w-full items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left text-sm transition-colors
          ${isSelected ? "bg-accent-500/15 text-accent-300" : "text-text-secondary hover:bg-background-elevated hover:text-text-primary"}`}
      >
        {isFolder ? <FolderIcon open={expanded} /> : <FileIcon />}
        <span className="truncate">{node.name}</span>
      </button>

      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderExplorerProps {
  root: FileNode;
  selectedPath: string | null;
  onSelectFile: (node: FileNode) => void;
}

export default function FolderExplorer({
  root,
  selectedPath,
  onSelectFile,
}: FolderExplorerProps) {
  return (
    <div className="overflow-y-auto py-2">
      {(root.children ?? []).map((child) => (
        <TreeRow
          key={child.id}
          node={child}
          depth={0}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
}
