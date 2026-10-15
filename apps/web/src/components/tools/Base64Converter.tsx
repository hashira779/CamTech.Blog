"use client";

import React, { useState } from "react";
import { Binary, Copy, Check, ArrowRightLeft, Upload, FileCode } from "lucide-react";
import { FormField, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// UTF-8 safe base64 encoding
function utf8ToBase64(str: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binary);
  if (urlSafe) {
    base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return base64;
}

// UTF-8 safe base64 decoding
function base64ToUtf8(base64: string): string {
  let clean = base64.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (clean.length % 4) {
    clean += "=";
  }
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function Base64Converter() {
  const [activeTab, setActiveTab] = useState("text");
  const [inputMode, setInputMode] = useState<"encode" | "decode">("encode");
  const [textInput, setTextInput] = useState("Hello CamTech Blog! ជំរាបសួរ 2026-2029 🚀");
  const [urlSafe, setUrlSafe] = useState(false);
  const [copied, setCopied] = useState(false);

  // File state
  const [fileDataUrl, setFileDataUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileType, setFileType] = useState("");

  const textOutput = React.useMemo(() => {
    if (!textInput.trim()) return "";
    try {
      if (inputMode === "encode") {
        return utf8ToBase64(textInput, urlSafe);
      } else {
        return base64ToUtf8(textInput);
      }
    } catch (err: any) {
      return `Error: ${err.message || "Invalid Base64 string"}`;
    }
  }, [textInput, inputMode, urlSafe]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleMode = () => {
    setInputMode(inputMode === "encode" ? "decode" : "encode");
    setTextInput(textOutput.startsWith("Error:") ? "" : textOutput);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Data Formatting & Transfer
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Base64 Text & File Converter
          </h2>
        </div>
        <Badge variant="accent" size="sm">
          UTF-8 & Khmer Safe
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="text">Text Encode / Decode</TabsTrigger>
          <TabsTrigger value="file">Image & File to Base64</TabsTrigger>
        </TabsList>

        {/* TAB 1: TEXT */}
        <TabsContent value="text" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={inputMode === "encode" ? "primary" : "outline"}
                size="sm"
                onClick={() => setInputMode("encode")}
              >
                Encode (Text → Base64)
              </Button>
              <Button
                variant={inputMode === "decode" ? "primary" : "outline"}
                size="sm"
                onClick={() => setInputMode("decode")}
              >
                Decode (Base64 → Text)
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleMode} title="Swap input & output">
                <ArrowRightLeft size={14} />
              </Button>
            </div>

            {inputMode === "encode" && (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={urlSafe}
                  onChange={(e) => setUrlSafe(e.target.checked)}
                  className="rounded border-input text-accent focus:ring-ring"
                />
                URL-Safe Base64 (base64url)
              </label>
            )}
          </div>

          <FormField
            label={inputMode === "encode" ? "Source Text / Plaintext" : "Source Base64 String"}
            id="base64-input"
          >
            <Textarea
              id="base64-input"
              rows={5}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                inputMode === "encode" ? "Type or paste text to encode..." : "Paste Base64 data to decode..."
              }
              className="font-mono text-sm"
            />
          </FormField>

          <FormField
            label={inputMode === "encode" ? "Base64 Output" : "Decoded Text Output"}
            id="base64-output"
            helperText={`${textOutput.length.toLocaleString()} characters`}
          >
            <Textarea
              id="base64-output"
              rows={5}
              readOnly
              value={textOutput}
              className="font-mono text-sm bg-surface-muted"
            />
          </FormField>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(textOutput)}
              disabled={!textOutput || textOutput.startsWith("Error:")}
              className="gap-1.5"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? "Copied output!" : "Copy Result"}
            </Button>
          </div>
        </TabsContent>

        {/* TAB 2: FILE / IMAGE */}
        <TabsContent value="file" className="space-y-5">
          <div className="rounded-lg border-2 border-dashed border-border-strong p-6 text-center hover:bg-surface-muted transition-colors">
            <input
              type="file"
              id="base64-file-upload"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="base64-file-upload"
              className="flex flex-col items-center justify-center cursor-pointer gap-2"
            >
              <Upload size={28} className="text-accent" />
              <span className="text-sm font-semibold text-foreground">
                Click or drag image/file here to convert to Base64
              </span>
              <span className="text-xs text-muted-foreground">
                All files processed 100% in your browser. Nothing is uploaded to any server.
              </span>
            </label>
          </div>

          {fileDataUrl && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-muted p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">File: </span>
                  <span className="font-semibold text-foreground">{fileName}</span> ({(fileSize / 1024).toFixed(1)} KB)
                </div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-mono text-foreground">{fileType || "application/octet-stream"}</span>
                </div>
              </div>

              {fileType.startsWith("image/") && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface p-4">
                  <span className="text-xs text-muted-foreground mb-2">Live Image Preview</span>
                  <img
                    src={fileDataUrl}
                    alt={fileName}
                    className="max-h-56 max-w-full rounded object-contain border border-border"
                  />
                </div>
              )}

              <FormField
                label="Base64 Data URI"
                id="file-base64-output"
                helperText={`${fileDataUrl.length.toLocaleString()} characters (+33% base64 payload overhead)`}
              >
                <Textarea
                  id="file-base64-output"
                  rows={6}
                  readOnly
                  value={fileDataUrl}
                  className="font-mono text-xs bg-surface-muted select-all"
                />
              </FormField>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(fileDataUrl)}
                  className="gap-1.5"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  {copied ? "Copied Data URI!" : "Copy Full Data URI"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(fileDataUrl.split(",")[1] || fileDataUrl)}
                  className="gap-1.5"
                >
                  <FileCode size={14} />
                  Copy Raw Base64
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
