 'use client'
import { useState, useEffect } from 'react'
import UploadButton from './UploadButton'
import ReactMarkdown from 'react-markdown'

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const analyzeResume = async () => {
    if (!files) return
    const formData = new FormData()
    formData.append('file', files[0])
    setServerError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        const msg = data?.error ?? 'Failed to analyze PDF'
        setServerError(typeof msg === 'string' ? msg : JSON.stringify(msg))
        setLoading(false)
        return
      }

      // prefer `analysis` from API, fall back to extracted `text`
      const a = data.analysis ?? data.text ?? ''
      setAnalysis(typeof a === 'string' ? a : JSON.stringify(a, null, 2))
    } catch (e: any) {
      setServerError(e?.message ?? 'Failed to analyze PDF')
    } finally {
      setLoading(false)
    }
  }

  // Safety: if analysis or serverError are set, make sure loading is cleared
  useEffect(() => {
    if (analysis || serverError) {
      setLoading(false)
    }
  }, [analysis, serverError])

  // Failsafe: if loading remains true for too long, auto-clear it to avoid stuck overlay
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn('Loading overlay auto-cleared after timeout')
      setLoading(false)
    }, 20000)
    return () => clearTimeout(t)
  }, [loading])

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Mobile header: show title on top for small screens */}
      <header className="w-full bg-[#0b3d91] p-4 text-center md:hidden">
        <h1 className="text-white text-2xl font-extrabold">AI Resume Destroyer</h1>
      </header>
  {/* Layout: stacked on mobile, split left/right on md+ */}
  <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left / First part: white background with centered rounded square upload block */}
        <section className="flex-2 bg-white p-6">
          <div className="w-full h-full relative flex">
            {/* Left-panel content container (we scope loading overlay inside here) */}
            {!analysis ? (
              <div className="w-full max-w-md mx-auto flex items-center justify-center">
                <UploadButton
                  onFiles={(f) => {
                    setFiles(f)
                    setServerError(null)
                  }}
                  multiple={false}
                  accept=".pdf"
                  label="Upload your resume"
                  analyzeResume={analyzeResume}
                  serverError={serverError}
                  loading={loading}
                />
              </div>
            ) : (
              <div className="w-full h-full">
                <div className="h-[75%] w-full bg-white border rounded-md shadow-sm overflow-auto text-black">
                  <div className="p-6 h-full">
                    <ReactMarkdown>{analysis ?? ''}</ReactMarkdown>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      // reset to allow re-upload / re-run
                      setAnalysis(null)
                      setFiles([])
                      setServerError(null)
                    }}
                    className="bg-gray-500 border border-slate-200 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-700"
                  >
                    Start over
                  </button>
                </div>
              </div>
            )}

            {/* Loading overlay scoped to left panel */}
            {loading && (
              <div className="absolute inset-0 z-40 flex items-center justify-center">
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
                <div className="z-50">
                  <svg className="animate-spin h-12 w-12 text-indigo-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right / Second part: dark blue with fancy title. Hidden on small screens */}
        <aside className="hidden md:flex flex-1 items-center justify-center bg-[#0b3d91] p-8">
          <div className="max-w-lg text-center">
            <h1 className="text-white text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg">
              AI Resume Destroyer
            </h1>
            <p className="mt-4 text-indigo-100 text-lg">Mercilessly dissect every aspect of your professional presentation</p>
          </div>
        </aside>
      </div>
    </div>
  )
}