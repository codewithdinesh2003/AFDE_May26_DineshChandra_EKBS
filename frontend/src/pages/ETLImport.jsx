import React, { useState, useEffect, useRef } from 'react'
import { etlAPI, downloadBlob } from '../api/api'

function StatusBadge({ status }) {
  const colors = {
    running: { bg: '#dbeafe', color: '#1d4ed8' },
    completed: { bg: '#dcfce7', color: '#16a34a' },
    failed: { bg: '#fee2e2', color: '#dc2626' },
  }
  const s = colors[status] || { bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color, textTransform: 'uppercase'
    }}>{status}</span>
  )
}

function formatDuration(seconds) {
  if (seconds == null) return '-'
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function JobDetailModal({ job, onClose }) {
  if (!job) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 8, padding: 28, maxWidth: 620,
        width: '90%', maxHeight: '80vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Job #{job.id} Details</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ['Job Name', job.job_name],
              ['Source File', job.source_file],
              ['Status', <StatusBadge key="s" status={job.status} />],
              ['Total Records', job.total_records],
              ['Success', job.success_count],
              ['Failed', job.failed_count],
              ['Started', job.started_at ? new Date(job.started_at).toLocaleString() : '-'],
              ['Completed', job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'],
              ['Duration', formatDuration(job.duration_seconds)],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '8px 4px', color: '#64748b', width: 130 }}>{k}</td>
                <td style={{ padding: '8px 4px', fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {job.error_log && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Error Log</div>
            <pre style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
              padding: 12, fontSize: 11, overflowX: 'auto', whiteSpace: 'pre-wrap',
              maxHeight: 200, overflowY: 'auto'
            }}>{job.error_log}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ETLImport() {
  const [sampleGenerated, setSampleGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState('')

  const [dragover, setDragover] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const inputRef = useRef()

  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [errorsOpen, setErrorsOpen] = useState(false)

  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => { fetchJobs() }, [])

  async function fetchJobs() {
    setJobsLoading(true)
    try {
      const res = await etlAPI.getJobs()
      setJobs(res.data?.data?.jobs || [])
    } catch { /* ignore */ }
    finally { setJobsLoading(false) }
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenerateMsg('')
    try {
      await etlAPI.generateSample()
      setSampleGenerated(true)
      setGenerateMsg('Sample data generated!')
    } catch (e) {
      setGenerateMsg('Failed: ' + (e.response?.data?.detail || e.message))
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownload(fmt) {
    try {
      const res = await etlAPI.downloadSample(fmt)
      downloadBlob(res.data, `articles.${fmt}`)
    } catch { alert('Download failed. Generate sample data first.') }
  }

  function validateFile(file) {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      setFileError('Only .csv and .json files are supported')
      return false
    }
    setFileError('')
    return true
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragover(false)
    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) setSelectedFile(file)
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (file && validateFile(file)) setSelectedFile(file)
  }

  async function handleImport() {
    if (!selectedFile) return
    setImporting(true)
    setResult(null)
    try {
      const res = await etlAPI.import(selectedFile)
      setResult(res.data?.data)
      fetchJobs()
    } catch (e) {
      setResult({ status: 'failed', success_count: 0, failed_count: 0, errors: [e.response?.data?.detail || e.message] })
    } finally {
      setImporting(false)
    }
  }

  function handleReset() {
    setSelectedFile(null)
    setResult(null)
    setErrorsOpen(false)
    setFileError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function openJobDetail(job) {
    try {
      const res = await etlAPI.getJob(job.id)
      setSelectedJob(res.data?.data)
    } catch { setSelectedJob(job) }
  }

  return (
    <div className="etl-page">
      <h1 style={{ margin: '0 0 4px 0' }}>ETL Data Import</h1>
      <p style={{ color: '#64748b', marginTop: 4, marginBottom: 24 }}>Import articles in bulk from CSV or JSON files</p>

      {/* Section 1: Sample Data */}
      <div className="etl-card">
        <h3>Step 1: Get Sample Data</h3>
        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 12px' }}>
          Generate 120 sample articles to test the import pipeline
        </p>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating}
          style={{ marginBottom: 8 }}
        >
          {generating ? '⏳ Generating...' : '⚙️ Generate Sample Data'}
        </button>
        {generateMsg && (
          <div style={{ fontSize: 13, color: generateMsg.startsWith('Failed') ? '#dc2626' : '#16a34a', marginBottom: 8 }}>
            {generateMsg.startsWith('Failed') ? generateMsg : `✅ ${generateMsg}`}
          </div>
        )}
        {(sampleGenerated) && (
          <div className="sample-buttons">
            <button className="btn btn-secondary" onClick={() => handleDownload('csv')}>⬇️ Download Sample CSV</button>
            <button className="btn btn-secondary" onClick={() => handleDownload('json')}>⬇️ Download Sample JSON</button>
          </div>
        )}
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>
          You can also upload your own CSV/JSON file directly
        </p>
      </div>

      {/* Section 2: Upload */}
      <div className="etl-card">
        <h3>Step 2: Upload &amp; Import</h3>
        {!result && (
          <>
            <div
              className={`dropzone${dragover ? ' dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragover(true) }}
              onDragLeave={() => setDragover(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className="dropzone-icon">📂</div>
              <p><strong>Drag &amp; Drop CSV or JSON file here</strong></p>
              <p style={{ fontSize: 12 }}>or click to browse</p>
              <input ref={inputRef} type="file" accept=".csv,.json" hidden onChange={handleFileSelect} />
            </div>
            {fileError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{fileError}</div>}
            {selectedFile && (
              <div className="file-info">
                <span>📄</span>
                <span style={{ fontWeight: 500 }}>{selectedFile.name}</span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <span style={{ color: '#16a34a' }}>✅</span>
                <button onClick={handleReset} style={{ marginLeft: 'auto', fontSize: 12, color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer' }}>Remove</button>
              </div>
            )}
            {importing && (
              <div className="import-progress" style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Importing {selectedFile?.name}... please wait</div>
                <div className="progress-bar-indeterminate" />
              </div>
            )}
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              disabled={!selectedFile || importing}
              onClick={handleImport}
            >
              {importing ? '⏳ Importing...' : '🚀 Start Import'}
            </button>
          </>
        )}

        {/* Results */}
        {result && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Import Results</h3>
              <StatusBadge status={result.status || 'completed'} />
            </div>
            <div className="result-stats">
              <div className="stat-box">
                <div className="stat-number">{result.total_records ?? 0}</div>
                <div className="stat-label">Total Records</div>
              </div>
              <div className="stat-box success">
                <div className="stat-number">{result.success_count ?? 0}</div>
                <div className="stat-label">Successfully Imported</div>
              </div>
              <div className="stat-box failed">
                <div className="stat-number">{result.failed_count ?? 0}</div>
                <div className="stat-label">Failed</div>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => setErrorsOpen(o => !o)}
                  style={{ fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {errorsOpen ? '▲' : '▼'} View Errors ({result.errors.length})
                </button>
                {errorsOpen && (
                  <div style={{ marginTop: 8 }}>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left', width: 40 }}>#</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.slice(0, 20).map((e, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{i + 1}</td>
                            <td style={{ padding: '6px 8px' }}>{e}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.errors.length > 20 && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                        Showing first 20 errors. Download job log for full details.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={handleReset}>
              Import Another File
            </button>
          </div>
        )}
      </div>

      {/* Section 3: Job History */}
      <div className="etl-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Import History</h3>
          <button onClick={fetchJobs} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }} title="Refresh">🔄</button>
        </div>
        {jobsLoading ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>No import jobs yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="job-history-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>File Name</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Success</th>
                  <th>Failed</th>
                  <th>Started</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} onClick={() => openJobDetail(job)}>
                    <td>#{job.id}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.source_file}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td>{job.total_records}</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>{job.success_count}</td>
                    <td style={{ color: job.failed_count > 0 ? '#dc2626' : '#64748b', fontWeight: job.failed_count > 0 ? 600 : 400 }}>{job.failed_count}</td>
                    <td style={{ fontSize: 11 }}>{job.started_at ? new Date(job.started_at).toLocaleString() : '-'}</td>
                    <td>{formatDuration(job.duration_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  )
}
