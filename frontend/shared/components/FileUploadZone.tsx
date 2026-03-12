'use client'

import { useCallback, useRef, useState } from 'react'

import { cn } from '~/shared/utils/cn'

const MAX_FILE_SIZE = 250 * 1024 * 1024
const ACCEPTED = '.pdf,.png,.jpg,.jpeg'

export interface FileEntry {
  name: string
  size: number
}

export interface UploadProgress {
  name: string
  size: number
  status: 'uploading' | 'done' | 'error'
  error?: string
}

export interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void | Promise<void>
  existingFiles?: FileEntry[]
  onRemoveFile?: (index: number) => void
  activeUploads?: UploadProgress[]
  disabled?: boolean
  accentColor?: 'teal' | 'lime'
  maxSizeMb?: number
  label?: string
  hint?: string
}

function fileIcon(name: string) {
  if (/\.pdf$/i.test(name)) return '📄'
  if (/\.(png|jpe?g|gif|webp)$/i.test(name)) return '🖼️'
  return '📎'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const THEMES = {
  teal: {
    accent: 'text-[#00c9b1]',
    accentBg: 'bg-[rgba(0,201,177,0.1)]',
    accentBgHover: 'hover:bg-[rgba(0,201,177,0.15)]',
    border: 'border-[#1a3a5c]',
    borderHover: 'hover:border-[#00c9b1] hover:text-[#00c9b1]',
    borderActive: 'border-[#00c9b1]/40 text-[#00c9b1]/60',
    fileBg: 'bg-[#0f2240]',
    fileName: 'text-[#cce6f7]',
    fileMeta: 'text-[#3a5a75]',
    muted: 'text-[#5a7fa0]',
    remove: 'text-[#ff4d6d] hover:text-[#ff6b85]',
    progressBg: 'bg-[#1a3a5c]',
    progressFill: 'bg-[#00c9b1]',
    spinner: 'border-[#1a3a5c] border-t-[#00c9b1]',
    done: 'text-[#00c9b1]',
    error: 'text-[#ff4d6d]',
  },
  lime: {
    accent: 'text-lime-400',
    accentBg: 'bg-lime-400/10',
    accentBgHover: 'hover:bg-lime-400/20',
    border: 'border-zinc-600',
    borderHover: 'hover:border-lime-400 hover:text-lime-400',
    borderActive: 'border-lime-400/40 text-lime-400/60',
    fileBg: 'bg-zinc-800/50',
    fileName: 'text-zinc-300',
    fileMeta: 'text-zinc-600',
    muted: 'text-zinc-500',
    remove: 'text-red-400 hover:text-red-300',
    progressBg: 'bg-zinc-700',
    progressFill: 'bg-lime-400',
    spinner: 'border-zinc-600 border-t-lime-400',
    done: 'text-lime-400',
    error: 'text-red-400',
  },
}

export function FileUploadZone({
  onFilesSelected,
  existingFiles = [],
  onRemoveFile,
  activeUploads = [],
  disabled = false,
  accentColor = 'teal',
  maxSizeMb = 250,
  label = 'Selecionar arquivos',
  hint,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const t = THEMES[accentColor]

  const maxBytes = maxSizeMb * 1024 * 1024

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      setError(null)

      const valid: File[] = []
      const errors: string[] = []

      for (const file of Array.from(fileList)) {
        if (file.size > maxBytes) {
          errors.push(`${file.name} excede ${maxSizeMb}MB`)
        } else {
          valid.push(file)
        }
      }

      if (errors.length > 0) setError(errors.join('; '))
      if (valid.length > 0) void onFilesSelected(valid)
    },
    [onFilesSelected, maxBytes, maxSizeMb]
  )

  const isUploading = activeUploads.some((u) => u.status === 'uploading')
  const doneCount = activeUploads.filter((u) => u.status === 'done').length
  const totalCount = activeUploads.length

  return (
    <div>
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className={cn(
                'flex items-center justify-between rounded-lg px-4 py-2.5',
                t.fileBg
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-xs">{fileIcon(f.name)}</span>
                <span
                  className={cn('truncate text-sm font-medium', t.fileName)}
                >
                  {f.name}
                </span>
                <span className={cn('flex-none text-xs', t.fileMeta)}>
                  {formatSize(f.size)}
                </span>
              </div>
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={() => onRemoveFile(i)}
                  className={cn(
                    'ml-3 flex-none text-sm font-medium transition-colors',
                    t.remove
                  )}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className={cn('mt-3 rounded-lg p-3', t.fileBg)}>
          <div
            className={cn(
              'mb-2 flex items-center justify-between text-xs',
              t.muted
            )}
          >
            <span>
              Enviando {totalCount} arquivo{totalCount > 1 ? 's' : ''}...
            </span>
            <span>
              {doneCount}/{totalCount}
            </span>
          </div>
          <div
            className={cn('h-1.5 overflow-hidden rounded-full', t.progressBg)}
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                t.progressFill
              )}
              style={{
                width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-2 space-y-1">
            {activeUploads.map((u, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {u.status === 'uploading' && (
                  <div
                    className={cn(
                      'h-3 w-3 flex-none animate-spin rounded-full border',
                      t.spinner
                    )}
                  />
                )}
                {u.status === 'done' && (
                  <span className={cn('flex-none', t.done)}>✓</span>
                )}
                {u.status === 'error' && (
                  <span className={cn('flex-none', t.error)}>✗</span>
                )}
                <span
                  className={cn(
                    'truncate',
                    u.status === 'done' && t.done,
                    u.status === 'error' && t.error,
                    u.status === 'uploading' && t.fileName
                  )}
                >
                  {u.name}
                </span>
                <span className={cn('flex-none', t.fileMeta)}>
                  {formatSize(u.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <label
        className={cn(
          'mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 text-sm transition-colors',
          disabled || isUploading
            ? cn('pointer-events-none', t.borderActive)
            : cn(t.border, t.borderHover, t.muted)
        )}
      >
        <span
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            t.accent,
            t.accentBg,
            t.accentBgHover
          )}
        >
          {label}
        </span>
        <span className={cn('text-xs', t.fileMeta)}>
          {hint ??
            `PDF, PNG, JPG — até ${maxSizeMb}MB por arquivo — múltiplos arquivos`}
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          disabled={disabled || isUploading}
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      {error && <p className={cn('mt-2 text-xs', t.error)}>{error}</p>}

      {activeUploads
        .filter((u) => u.status === 'error')
        .map((u, i) => (
          <p key={i} className={cn('mt-1 text-xs', t.error)}>
            {u.name}: {u.error}
          </p>
        ))}
    </div>
  )
}
