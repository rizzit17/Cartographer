import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { FolderGit2, FileCode2, Search } from 'lucide-react'
import { Input } from '@components/ui/Input'
import { EmptyState } from '@components/ui/EmptyState'

// Mock file tree data for Phase 3 UI testing
const MOCK_FILES = [
  { name: 'main.py', type: 'file', language: 'python', content: 'print("Hello Cartographer")' },
  { name: 'api', type: 'folder', children: [
    { name: 'routes.py', type: 'file', language: 'python', content: 'from fastapi import APIRouter\n\nrouter = APIRouter()' },
    { name: 'models.py', type: 'file', language: 'python', content: 'from pydantic import BaseModel\n\nclass User(BaseModel):\n    id: int' },
  ]},
  { name: 'package.json', type: 'file', language: 'json', content: '{\n  "name": "cartographer",\n  "version": "1.0.0"\n}' },
]

export default function RepositoryExplorer() {
  const [selectedFile, setSelectedFile] = useState<{name: string, language: string, content: string} | null>(null)

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* File Tree Sidebar */}
      <div className="w-72 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm mb-3">Explorer</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8 h-8 text-xs bg-secondary/50 border-border"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 text-sm">
          {MOCK_FILES.map((item, i) => (
            <FileTreeNode key={i} node={item} depth={0} onSelect={setSelectedFile} activeFile={selectedFile?.name} />
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
        {selectedFile ? (
          <>
            <div className="flex items-center px-4 h-10 border-b border-[#2d2d2d] bg-[#252526] text-[#cccccc] text-xs font-medium font-mono">
              <FileCode2 className="h-3.5 w-3.5 mr-2 text-[#4daafc]" />
              {selectedFile.name}
            </div>
            <div className="flex-1">
              <Editor
                height="100%"
                language={selectedFile.language}
                theme="vs-dark"
                value={selectedFile.content}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineHeight: 24,
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  readOnly: true, // Explorer is read-only
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<FolderGit2 className="h-12 w-12" />}
              title="Repository Explorer"
              description="Select a file from the sidebar to view its contents and AST graph properties."
              className="border-none bg-transparent"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function FileTreeNode({ node, depth, onSelect, activeFile }: any) {
  const [isOpen, setIsOpen] = useState(true)
  const isFile = node.type === 'file'
  const isActive = activeFile === node.name

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-secondary/60 cursor-pointer rounded-sm ${isActive ? 'bg-primary/20 text-primary' : 'text-foreground/80'}`}
        style={{ paddingLeft: `${(depth * 12) + 8}px` }}
        onClick={() => {
          if (isFile) onSelect(node)
          else setIsOpen(!isOpen)
        }}
      >
        {!isFile ? (
          <ChevronIcon isOpen={isOpen} />
        ) : (
          <FileCode2 className={`h-3.5 w-3.5 mr-1.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        )}
        <span className="truncate">{node.name}</span>
      </div>
      
      {!isFile && isOpen && node.children && (
        <div>
          {node.children.map((child: any, i: number) => (
            <FileTreeNode key={i} node={child} depth={depth + 1} onSelect={onSelect} activeFile={activeFile} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`mr-1 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''} text-muted-foreground`}
    >
      <path fillRule="evenodd" d="M10.072 8l-3.536 3.536-1.414-1.414L7.244 8 5.122 5.878l1.414-1.414L10.072 8z" />
    </svg>
  )
}
