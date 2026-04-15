"use client"

import { useState, useRef } from "react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthUser } from "@/hooks/use-auth-user"
import { useRouter } from "next/navigation"
import { Upload, FileText, Download, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PDFCompressorPage() {
  const { user, isHydrated } = useAuthUser()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState("")

  if (!isHydrated) {
    return (
      <AppShell>
        <PageHeader title="PDF Compressor" />
        <div className="mx-auto max-w-xl px-4 py-8">
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      </AppShell>
    )
  }

  if (!user || user.role !== "admin") {
    return (
      <AppShell>
        <PageHeader title="PDF Compressor" backHref="/" />
        <div className="mx-auto max-w-xl px-4 py-8 text-center">
          <p className="text-muted-foreground">Admin only.</p>
        </div>
      </AppShell>
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
      setResultUrl(null)
      setError("")
    } else {
      setError("Please select a PDF file")
    }
  }

  const handleCompress = async () => {
    if (!selectedFile) return

    setCompressing(true)
    setError("")

    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const pdfDoc = await import("pdf-lib").then(m => m.PDFDocument.load(arrayBuffer))
      
      const pages = pdfDoc.getPages()
      for (const page of pages) {
        const { width, height } = page.getSize()
        page.scale(0.8)
      }
      
      const compressedPdf = await pdfDoc.save()
      const blob = new Blob([compressedPdf], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      
      setResultUrl(url)
    } catch (err) {
      setError("Failed to compress PDF")
      console.error(err)
    } finally {
      setCompressing(false)
    }
  }

  return (
    <AppShell>
      <PageHeader title="PDF Compressor" backHref="/dashboard" />
      <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Compress PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload PDF
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {selectedFile && (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <FileText className="h-8 w-8 text-primary" />
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
                <p className="text-sm text-success">PDF compressed successfully!</p>
                <Button className="w-full" asChild>
                  <a href={resultUrl} download={`compressed_${selectedFile?.name}`}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Compressed PDF
                  </a>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  setSelectedFile(null)
                  setResultUrl(null)
                }}>
                  Compress Another
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleCompress}
                disabled={!selectedFile || compressing}
              >
                {compressing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  "Compress PDF"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}