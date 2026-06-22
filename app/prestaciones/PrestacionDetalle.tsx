'use client'

import { useState } from 'react'
import type React from 'react'
import { formatFechaCorta } from '@/lib/utils'
import type { Prestacion } from '@/types'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/Money'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, Trash2, Edit, Receipt, Paperclip, Upload, Download, Eye, X, FileText, File } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface Props {
  prestacion: Prestacion
  onClose: () => void
  onBoletaEmitida: (p: Prestacion, fecha: string) => Promise<void>
  onPagada: (p: Prestacion, fecha: string) => Promise<void>
  onEliminar: (id: string) => Promise<void>
  onEditar?: (p: Prestacion, data: Partial<Prestacion>) => Promise<void>
  onFilesChange?: (prestacionId: string, files: Prestacion['files']) => void
}

export default function PrestacionDetalle({ prestacion: p, onBoletaEmitida, onPagada, onEliminar, onEditar, onFilesChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [fechaAccion, setFechaAccion] = useState(new Date().toISOString().split('T')[0])
  const [files, setFiles] = useState(p.files || [])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirmingAction, setConfirmingAction] = useState<'boleta' | 'pago' | null>(null)
  const [textPreviews, setTextPreviews] = useState<Record<string, string>>({})
  const [expandedText, setExpandedText] = useState<Record<string, boolean>>({})
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    tipo_prestacion: p.tipo_prestacion,
    fecha_prestacion: p.fecha_prestacion,
    monto_bruto: p.monto_bruto,
    notas: p.notas || '',
  })
  const isJsonDbMode = process.env.NEXT_PUBLIC_USE_JSON_DB === 'true'

  // Calculate missing values if they're NaN (for records created before the fix)
  const retencionPct = p.retencion_pct || 0
  const montoRetencion = isNaN(p.monto_retencion) ? Math.round(p.monto_bruto * retencionPct / 100) : p.monto_retencion
  const montoNeto = isNaN(p.monto_neto) ? Math.round(p.monto_bruto * (1 - retencionPct / 100)) : p.monto_neto

  async function uploadCurrentFile() {
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const response = await fetch(`/api/prestaciones/${p.id}/files/upload`, { method: 'POST', body: formData })
      if (!response.ok) throw new Error((await response.json()).error || 'Error al subir archivo')
      const result = await response.json()
      if (result.file) {
        const newFiles = [...files, result.file]
        setFiles(newFiles)
        onFilesChange?.(p.id, newFiles)
      }
      setSelectedFile(null)
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Error al subir archivo')
    } finally {
      setUploading(false)
    }
  }

  async function handleBoletaEmitida() {
    setLoading(true)
    if (selectedFile) await uploadCurrentFile()
    await onBoletaEmitida(p, fechaAccion)
    setLoading(false)
    setConfirmingAction(null)
  }

  async function handlePagada() {
    setLoading(true)
    if (selectedFile) await uploadCurrentFile()
    await onPagada(p, fechaAccion)
    setLoading(false)
    setConfirmingAction(null)
  }

  async function handleEliminar() {
    setLoading(true)
    await onEliminar(p.id)
    setLoading(false)
  }

  async function handleGuardar() {
    if (!onEditar) return
    setLoading(true)
    await onEditar(p, {
      tipo_prestacion: editData.tipo_prestacion,
      fecha_prestacion: editData.fecha_prestacion,
      monto_bruto: Number(editData.monto_bruto),
      notas: editData.notas || null,
    })
    setIsEditing(false)
    setLoading(false)
  }

  async function handleUpload() {
    await uploadCurrentFile()
  }

  async function loadPreview(file: { id: string; file_type: string }) {
    if (loadingPreview === file.id) return
    setLoadingPreview(file.id)
    try {
      const res = await fetch(`/api/prestaciones/${p.id}/files/${file.id}/download`)
      if (!res.ok) return
      const blob = await res.blob()
      if (file.file_type.startsWith('image/')) {
        const url = URL.createObjectURL(blob)
        setImageUrls(prev => ({ ...prev, [file.id]: url }))
      } else {
        const text = await blob.text()
        setTextPreviews(prev => ({ ...prev, [file.id]: text }))
        setExpandedText(prev => ({ ...prev, [file.id]: true }))
      }
    } finally {
      setLoadingPreview(null)
    }
  }

  function renderMarkdown(text: string) {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-sm font-semibold mt-3 mb-1">{line.slice(4)}</h3>)
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-base font-semibold mt-4 mb-1">{line.slice(3)}</h2>)
      } else if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-lg font-bold mt-4 mb-1">{line.slice(2)}</h1>)
      } else if (line.startsWith('```')) {
        const codeLines: string[] = []
        i++
        while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
        elements.push(<pre key={i} className="bg-muted rounded p-2 text-xs overflow-x-auto my-2 font-mono">{codeLines.join('\n')}</pre>)
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const items: string[] = []
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
          items.push(lines[i].slice(2)); i++
        }
        elements.push(<ul key={i} className="list-disc list-inside text-xs space-y-0.5 my-1">{items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}</ul>)
        continue
      } else if (/^\d+\. /.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          items.push(lines[i].replace(/^\d+\. /, '')); i++
        }
        elements.push(<ol key={i} className="list-decimal list-inside text-xs space-y-0.5 my-1">{items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}</ol>)
        continue
      } else if (line.startsWith('---') || line.startsWith('===')) {
        elements.push(<hr key={i} className="border-border my-2" />)
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-2" />)
      } else {
        elements.push(<p key={i} className="text-xs leading-relaxed">{inlineFormat(line)}</p>)
      }
      i++
    }
    return elements
  }

  function inlineFormat(text: string): React.ReactNode {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-muted rounded px-1 font-mono text-[11px]">{part.slice(1, -1)}</code>
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
      return part
    })
  }

  function fileIcon(type: string) {
    if (type.startsWith('image/')) return <div className="size-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0"><Eye className="size-4 text-blue-500" /></div>
    if (type === 'application/pdf') return <div className="size-8 rounded bg-destructive/10 flex items-center justify-center shrink-0"><File className="size-4 text-destructive" /></div>
    return <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0"><FileText className="size-4 text-muted-foreground" /></div>
  }

  function InfoRow({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
    return (
      <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-medium ${accent ?? 'text-foreground'}`}>{value}</span>
      </div>
    )
  }

  return (
    <div className="p-6 pb-safe">
      {/* Handle bar */}
      <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />

      <SheetHeader className="text-left mb-5">
        <SheetTitle className="text-lg font-semibold">{p.institucion_nombre}</SheetTitle>
        {!isEditing && (
          <p className="text-sm text-muted-foreground">
            {p.tipo_prestacion} · {formatFechaCorta(p.fecha_prestacion)}
          </p>
        )}
      </SheetHeader>

      {/* Montos - read only */}
      {!isEditing && (
        <div className="bg-muted/40 rounded-xl p-4 mb-5 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Monto bruto</span>
            <Money value={p.monto_bruto} size="lg" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Retención {retencionPct.toFixed(1)}%</span>
            <Money value={-montoRetencion} size="sm" showSign />
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Neto a recibir</span>
            <Money value={montoNeto} size="lg" className="text-success" />
          </div>
        </div>
      )}

      {/* Edit form */}
      {isEditing ? (
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Tipo de prestación</label>
            <input
              type="text"
              value={editData.tipo_prestacion}
              onChange={e => setEditData({ ...editData, tipo_prestacion: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Fecha prestación</label>
            <input
              type="date"
              value={editData.fecha_prestacion}
              onChange={e => setEditData({ ...editData, fecha_prestacion: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Monto bruto</label>
            <input
              type="number"
              value={editData.monto_bruto}
              onChange={e => setEditData({ ...editData, monto_bruto: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Notas</label>
            <textarea
              rows={2}
              value={editData.notas}
              onChange={e => setEditData({ ...editData, notas: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleGuardar} disabled={loading} className="flex-1">
              {loading ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      ) : (
        /* Info rows - read only */
        <div className="mb-5">
          {p.es_turno && p.horas && p.valor_hora && (
            <InfoRow label="Turno" value={`${p.horas}h × $${p.valor_hora.toLocaleString('es-CL')}/h`} />
          )}
          <InfoRow label="Tipo documento" value={<span className="capitalize">{p.tipo_documento}</span>} />
          {p.fecha_limite_boleta && (
            <InfoRow label="Límite boleta" value={formatFechaCorta(p.fecha_limite_boleta)} />
          )}
          {p.fecha_boleta_emitida && (
            <InfoRow label="Boleta emitida" value={formatFechaCorta(p.fecha_boleta_emitida)} />
          )}
          {p.fecha_limite_pago && (
            <InfoRow label="Límite pago" value={formatFechaCorta(p.fecha_limite_pago)} />
          )}
          {p.fecha_pago_recibido && (
            <InfoRow label="Pago recibido" value={formatFechaCorta(p.fecha_pago_recibido)} accent="text-success" />
          )}
          {p.notas && (
            <InfoRow label="Notas" value={p.notas} />
          )}
        </div>
      )}

      {/* Archivos adjuntos */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">
            Archivos adjuntos{files.length > 0 ? ` · ${files.length}` : ''}
          </p>
          <div className="flex items-center gap-2">
            {selectedFile && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {uploading ? 'Subiendo…' : `Subir "${selectedFile.name}"`}
              </button>
            )}
            <input
              id="files-upload"
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt,.md,.xml"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => document.getElementById('files-upload')?.click()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Paperclip className="size-3" />
              Adjuntar
            </button>
          </div>
        </div>
        {files.length > 0 && (
        <div className="flex flex-col gap-2">
            {files.map(file => {
              const isImage = file.file_type.startsWith('image/')
              const isText = file.file_type.startsWith('text/') || file.file_type === 'application/xml'
              const imgUrl = imageUrls[file.id]
              const textContent = textPreviews[file.id]
              const isExpanded = expandedText[file.id]
              const isLoading = loadingPreview === file.id

              return (
                <div key={file.id} className="rounded-lg border border-border/60 overflow-hidden">
                  {/* Image thumbnail */}
                  {isImage && imgUrl && (
                    <button
                      type="button"
                      className="w-full block"
                      onClick={() => setLightboxUrl(imgUrl)}
                    >
                      <img
                        src={imgUrl}
                        alt={file.filename}
                        className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity"
                      />
                    </button>
                  )}

                  {/* File row */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30">
                    {fileIcon(file.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.filename}</p>
                      <p className="text-[10px] text-muted-foreground">{(file.file_size / 1024).toFixed(1)} KB</p>
                    </div>
                    {!isJsonDbMode && (isImage || isText) && !imgUrl && !textContent && (
                      <button
                        type="button"
                        onClick={() => loadPreview(file)}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-50"
                      >
                        <Eye className="size-3" />
                        {isLoading ? 'Cargando…' : 'Ver'}
                      </button>
                    )}
                    {isImage && imgUrl && (
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(imgUrl)}
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <Eye className="size-3" /> Ampliar
                      </button>
                    )}
                    {isText && textContent && (
                      <button
                        type="button"
                        onClick={() => setExpandedText(prev => ({ ...prev, [file.id]: !isExpanded }))}
                        className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <Eye className="size-3" /> {isExpanded ? 'Ocultar' : 'Ver'}
                      </button>
                    )}
                    {!isJsonDbMode && (
                      <a
                        href={`/api/prestaciones/${p.id}/files/${file.id}/download`}
                        download={file.filename}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <Download className="size-3" />
                      </a>
                    )}
                  </div>

                  {/* Text/markdown preview */}
                  {isText && isExpanded && textContent && (
                    <div className="px-3 py-3 border-t border-border/40 bg-background max-h-64 overflow-y-auto">
                      {file.filename.endsWith('.md')
                        ? <div className="text-foreground">{renderMarkdown(textContent)}</div>
                        : <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">{textContent}</pre>
                      }
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Image lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={open => !open && setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/90 border-0">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>

      {/* Actions */}
      {p.estado !== 'pagada' && (
        <div className="flex flex-col gap-3 mb-4">
          {/* Trigger buttons */}
          {!confirmingAction && (
            <>
              {p.estado === 'realizada' && (
                <Button onClick={() => { setSelectedFile(null); setConfirmingAction('boleta') }} className="w-full gap-2">
                  <Receipt className="size-4" />
                  Marcar boleta como emitida
                </Button>
              )}
              {p.estado === 'boleta_emitida' && (
                <Button onClick={() => { setSelectedFile(null); setConfirmingAction('pago') }} className="w-full gap-2">
                  <CheckCircle2 className="size-4" />
                  Marcar como pagada
                </Button>
              )}
            </>
          )}

          {/* Inline confirmation panel */}
          {confirmingAction && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">
                {confirmingAction === 'boleta' ? 'Confirmar boleta emitida' : 'Confirmar pago recibido'}
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {confirmingAction === 'boleta' ? 'Fecha de emisión' : 'Fecha de pago'}
                </label>
                <input
                  type="date"
                  value={fechaAccion}
                  onChange={e => setFechaAccion(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {confirmingAction === 'boleta' ? 'Adjuntar boleta (opcional)' : 'Adjuntar comprobante (opcional)'}
                </label>
                <input
                  id="action-file-input"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt,.md"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('action-file-input')?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border bg-background text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  <Paperclip className="size-4 shrink-0" />
                  <span className="truncate">{selectedFile ? selectedFile.name : 'Seleccionar archivo…'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => { setConfirmingAction(null); setSelectedFile(null) }}
                  disabled={loading || uploading}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={confirmingAction === 'boleta' ? handleBoletaEmitida : handlePagada}
                  disabled={loading || uploading}
                >
                  {loading || uploading ? 'Guardando…' : 'Confirmar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer: edit + delete */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="flex-1 gap-1.5">
          <Edit className="size-3.5" /> {isEditing ? 'Volver' : 'Editar'}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30">
              <Trash2 className="size-3.5" /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar prestación?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará permanentemente la prestación de {p.institucion_nombre}. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEliminar}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
