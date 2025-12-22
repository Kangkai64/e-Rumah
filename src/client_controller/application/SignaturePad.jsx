import { useRef, useEffect } from 'react'

export default function SignaturePad({ value, onChange, label = 'Signature' }) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas && value) {
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
      }
      img.src = value
    }
  }, [value])

  const startDrawing = (e) => {
    isDrawing.current = true
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    ctx.beginPath()
    ctx.moveTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    )
  }

  const draw = (e) => {
    if (!isDrawing.current) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    ctx.lineTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    )
    ctx.strokeStyle = '#161519'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    isDrawing.current = false
    const canvas = canvasRef.current
    if (canvas) {
      onChange(canvas.toDataURL('image/png'))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div className="signature-pad-container">
      <label className="signature-label">{label}</label>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="signature-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <button type="button" onClick={clearSignature} className="signature-clear-btn">
        Clear
      </button>
    </div>
  )
}
