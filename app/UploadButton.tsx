'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'

type UploadButtonProps = {
    onFiles?: (files: File[]) => void
    multiple?: boolean
    accept?: string
    label?: string
    className?: string
    analyzeResume?: () => void
    serverError?: string | null
    loading?: boolean
}

type SelectedFile = { file: File; preview?: string }

export default function UploadButton({
    onFiles,
    multiple = false,
    accept = '.pdf',
    label = 'Upload or drag a PDF here',
    className = '',
    analyzeResume,
    serverError = null,
    loading = false,
}: UploadButtonProps) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        return () => {
            // revoke previews
            selectedFiles.forEach((s) => s.preview && URL.revokeObjectURL(s.preview))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const isPdf = (file: File) => {
        if (file.type === 'application/pdf') return true
        return file.name.toLowerCase().endsWith('.pdf')
    }

    const handleFiles = useCallback(
        (files: FileList | null) => {
            setError(null)
            if (!files || files.length === 0) return

            const accepted: SelectedFile[] = []
            for (let i = 0; i < files.length; i++) {
                const f = files[i]
                if (!isPdf(f)) {
                    setError('Only PDF files are allowed.')
                    continue
                }
                const preview = URL.createObjectURL(f)
                accepted.push({ file: f, preview })
                if (!multiple) break
            }

            if (accepted.length > 0) {
                setSelectedFiles((prev) => (multiple ? [...prev, ...accepted] : accepted))
                onFiles && onFiles(accepted.map((s) => s.file))
            }
        },
        [multiple, onFiles]
    )

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files)
        // reset the input so same file can be selected again if removed
        if (inputRef.current) inputRef.current.value = ''
    }

    const onClick = () => inputRef.current && inputRef.current.click()

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(true)
    }

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
    }

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => {
            const next = prev.slice()
            const removed = next.splice(index, 1)[0]
            if (removed && removed.preview) URL.revokeObjectURL(removed.preview)
            onFiles && onFiles(next.map((s) => s.file))
            return next
        })
        setError(null)
    }

    return (
        <div className={`w-64 ${className}`}>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={onInputChange}
                aria-hidden="true"
            />

            <div
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`h-64 rounded-2xl bg-slate-50 shadow-md border-2 border-dashed flex items-center justify-center p-4 cursor-pointer select-none ${
                    dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200'
                }`}
            >
                {selectedFiles.length === 0 ? (
                    <div className="text-center px-4">
                        <div className="text-lg font-semibold text-slate-700">{label}</div>
                        <div className="mt-2 text-sm text-slate-500">Click or drag a PDF file here</div>
                    </div>
                ) : (
                    <div className="w-full">
                        {selectedFiles.map((s, idx) => (
                            <div key={idx} className={`relative bg-white rounded-md shadow-sm border overflow-hidden cursor-default ${selectedFiles.length > 1 ? 'mb-4' : ''}`}>
                                <div className="h-40 flex flex-col items-center justify-center p-3">
                                    <svg className="w-12 h-12 text-red-600" viewBox="0 0 24 24" fill="gray" aria-hidden>
                                        <path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                                    </svg>
                                    <div className="mt-3 px-2 w-full">
                                        <div
                                            className="text-sm font-medium text-slate-700 truncate text-center"
                                            title={s.file.name}
                                        >
                                            {s.file.name}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeFile(idx)
                                    }}
                                    aria-label={`Remove ${s.file.name}`}
                                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow cursor-pointer"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
                    {selectedFiles.length > 0 && (
                        <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            analyzeResume && analyzeResume()
                                        }}
                                        disabled={loading}
                                        className={`cursor-pointer w-full ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-medium px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                                    >
                                        Continue to review
                                    </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md p-2">
                            {error}
                        </div>
                    )}
                    {serverError && (
                        <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md p-2">
                            {serverError}
                        </div>
                    )}
        </div>
    )
}