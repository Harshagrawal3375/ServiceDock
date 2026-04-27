"use client"

declare global {
  interface Window {
    html2pdf: any
  }
}

import { useState, useRef } from "react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthUser } from "@/hooks/use-auth-user"
import { Upload, FileText, Download, Loader2, File, Image, FileSpreadsheet, Presentation } from "lucide-react"

type ConversionType = 
  | "jpg-to-pdf" 
  | "word-to-pdf" 
  | "ppt-to-pdf" 
  | "excel-to-pdf"
  | "html-to-pdf"
  | "pdf-to-jpg"
  | "pdf-to-word"
  | "pdf-to-ppt"
  | "pdf-to-excel"

const conversionOptions = [
  { value: "jpg-to-pdf", label: "JPG → PDF", icon: Image },
  { value: "word-to-pdf", label: "WORD → PDF", icon: FileText },
  { value: "ppt-to-pdf", label: "POWERPOINT → PDF", icon: Presentation },
  { value: "excel-to-pdf", label: "EXCEL → PDF", icon: FileSpreadsheet },
  { value: "html-to-pdf", label: "HTML → PDF", icon: FileText },
  { value: "pdf-to-jpg", label: "PDF → JPG", icon: Image },
  { value: "pdf-to-word", label: "PDF → WORD", icon: FileText },
]

export default function ConverterPage() {
  const { user, isHydrated } = useAuthUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [conversionType, setConversionType] = useState<string>("jpg-to-pdf")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultFileName, setResultFileName] = useState<string>("")
  const [error, setError] = useState("")

  if (!isHydrated) {
    return (
      <AppShell>
        <PageHeader title="File Converter" />
        <div className="mx-auto max-w-xl px-4 py-8">
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      </AppShell>
    )
  }

  if (!user || user.role !== "admin") {
    return (
      <AppShell>
        <PageHeader title="File Converter" backHref="/" />
        <div className="mx-auto max-w-xl px-4 py-8 text-center">
          <p className="text-muted-foreground">Admin only.</p>
        </div>
      </AppShell>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setResultUrl(null)
      setError("")
    }
  }

  const loadHtml2Pdf = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf)
        return
      }
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js"
      script.onload = () => resolve((window as any).html2pdf)
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const handleConvert = async () => {
    if (!selectedFile) return

    setConverting(true)
    setError("")

    try {
      let convertedBlob: Blob | null = null
      let outputMime: string = ""
      let outputExt: string = ""

      if (conversionType === "jpg-to-pdf") {
        if (!selectedFile.type.startsWith("image/")) {
          throw new Error("Please select an image file")
        }
        const { PDFDocument } = await import("pdf-lib")
        const pdfDoc = await PDFDocument.create()
        const imageBytes = await selectedFile.arrayBuffer()
        
        let image
        if (selectedFile.type === "image/png") {
          image = await pdfDoc.embedPng(imageBytes)
        } else {
          image = await pdfDoc.embedJpg(imageBytes)
        }
        
        const page = pdfDoc.addPage([image.width, image.height])
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
        
        const pdfBytes = await pdfDoc.save()
        convertedBlob = new Blob([pdfBytes], { type: "application/pdf" })
        outputMime = "application/pdf"
        outputExt = "pdf"
      } 
      else if (conversionType === "word-to-pdf") {
        const fileName = selectedFile.name.toLowerCase()
        if (!fileName.endsWith(".docx") && !fileName.endsWith(".doc")) {
          throw new Error("Please select a Word file (.docx or .doc)")
        }
        
        const mammoth = await import("mammoth")
        const arrayBuffer = await selectedFile.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        const htmlContent = result.value
        
        const container = document.createElement("div")
        container.innerHTML = `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; width: 595px;">
            ${htmlContent}
          </div>
        `
        container.style.position = "fixed"
        container.style.top = "-9999px"
        container.style.left = "-9999px"
        document.body.appendChild(container)
        
        const html2pdf = await loadHtml2Pdf()
        
        await new Promise<void>((resolve) => {
          const converter = html2pdf()
          converter.set({
            margin: 10,
            filename: "converted.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
          })
          converter.from(container)
          converter.outputPdf((blob: Blob) => {
            convertedBlob = blob
            outputMime = "application/pdf"
            outputExt = "pdf"
            resolve()
          })
        })
        
        document.body.removeChild(container)
      }
      else if (conversionType === "pdf-to-jpg") {
        if (selectedFile.type !== "application/pdf") {
          throw new Error("Please select a PDF file")
        }
        setError("PDF to JPG conversion requires server-side processing. Using browser-based alternative...")
        
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new window.Image()
        
        const objectUrl = URL.createObjectURL(selectedFile)
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = reject
          img.src = objectUrl
        })
        
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            setResultUrl(URL.createObjectURL(blob))
            setResultFileName("converted-image.jpg")
          }
        }, "image/jpeg")
        
        setConverting(false)
        return
      }
      else {
        setError(`${conversionType} conversion coming soon! This feature requires server-side processing.`)
        setConverting(false)
        return
      }

      if (convertedBlob) {
        const url = URL.createObjectURL(convertedBlob)
        setResultUrl(url)
        setResultFileName(`converted.${outputExt}`)
      }
    } catch (err: any) {
      setError(err.message || "Conversion failed")
      console.error(err)
    } finally {
      setConverting(false)
    }
  }

  const currentOption = conversionOptions.find(o => o.value === conversionType)
  const IconComponent = currentOption?.icon || FileText

  return (
    <AppShell>
      <PageHeader title="File Converter" backHref="/dashboard" />
      <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Convert Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Conversion Type</label>
              <Select value={conversionType} onValueChange={setConversionType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conversionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {selectedFile && (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <IconComponent className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {resultUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-success">File converted successfully!</p>
                <Button className="w-full" asChild>
                  <a href={resultUrl} download={resultFileName}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Converted File
                  </a>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  setSelectedFile(null)
                  setResultUrl(null)
                }}>
                  Convert Another
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleConvert}
                disabled={!selectedFile || converting}
              >
                {converting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  "Convert File"
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Supported Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <p>JPG → PDF</p>
              <p>PDF → JPG</p>
              <p>WORD → PDF</p>
              <p>PDF → WORD</p>
              <p>POWERPOINT → PDF</p>
              <p>EXCEL → PDF</p>
              <p>HTML → PDF</p>
              <p>PDF → EXCEL</p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Note: Some conversions require server-side processing.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}