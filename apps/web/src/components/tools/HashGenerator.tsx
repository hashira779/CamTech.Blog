"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Copy, Check, Upload, FileCode, CheckCircle2, XCircle } from "lucide-react";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type HashAlgo = "SHA-256" | "SHA-512" | "SHA-384" | "SHA-1";

async function computeHash(algo: HashAlgo, buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algo, buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function HashGenerator() {
  const [activeTab, setActiveTab] = useState("text");
  const [algo, setAlgo] = useState<HashAlgo>("SHA-256");
  const [textInput, setTextInput] = useState("The quick brown fox jumps over the lazy dog");
  const [hashOutput, setHashOutput] = useState("");
  const [uppercase, setUppercase] = useState(false);
  const [verifyHash, setVerifyHash] = useState("");
  const [copied, setCopied] = useState(false);

  // File hashing state
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileHash, setFileHash] = useState("");
  const [isHashingFile, setIsHashingFile] = useState(false);

  // Compute text hash
  useEffect(() => {
    if (!textInput) {
      setHashOutput("");
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(textInput);
    computeHash(algo, data.buffer as ArrayBuffer).then((h) => {
      setHashOutput(uppercase ? h.toUpperCase() : h);
    });
  }, [textInput, algo, uppercase]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    setIsHashingFile(true);

    try {
      const buffer = await file.arrayBuffer();
      const h = await computeHash(algo, buffer);
      setFileHash(uppercase ? h.toUpperCase() : h);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHashingFile(false);
    }
  };

  const currentDisplayHash = activeTab === "text" ? hashOutput : fileHash;

  // Verification
  const verificationStatus = React.useMemo(() => {
    if (!verifyHash.trim() || !currentDisplayHash) return null;
    const cleanVerify = verifyHash.trim().toLowerCase();
    const cleanCurrent = currentDisplayHash.trim().toLowerCase();
    return cleanVerify === cleanCurrent ? "match" : "mismatch";
  }, [verifyHash, currentDisplayHash]);

  const handleCopy = (h: string) => {
    navigator.clipboard.writeText(h);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Data Integrity & Verification
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Cryptographic Hash & Checksum Tool
          </h2>
        </div>
        <Badge variant="accent" size="sm">
          Web Crypto API
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Cryptographic Algorithm" id="hash-algo">
          <Select id="hash-algo" value={algo} onChange={(e) => setAlgo(e.target.value as HashAlgo)}>
            <option value="SHA-256">SHA-256 (Industry Standard 256-bit)</option>
            <option value="SHA-512">SHA-512 (High-Security 512-bit)</option>
            <option value="SHA-384">SHA-384 (NIST 384-bit)</option>
            <option value="SHA-1">SHA-1 (Legacy Git / Legacy Checksums)</option>
          </Select>
        </FormField>

        <div className="flex flex-col justify-end">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-xs font-medium text-foreground hover:bg-surface-muted">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="rounded border-input text-accent focus:ring-ring"
            />
            Uppercase Hex Output
          </label>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="text">Text Hashing</TabsTrigger>
          <TabsTrigger value="file">File Checksum</TabsTrigger>
        </TabsList>

        {/* TAB 1: TEXT HASH */}
        <TabsContent value="text" className="space-y-4">
          <FormField label="Source Text / Payload" id="hash-text-input">
            <Textarea
              id="hash-text-input"
              rows={4}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type or paste text to compute checksum..."
              className="font-mono text-sm leading-relaxed"
            />
          </FormField>

          <FormField
            label={`${algo} Checksum Output`}
            id="hash-output"
            helperText={`${hashOutput.length * 4} bits (${hashOutput.length} hex characters)`}
          >
            <div className="relative">
              <Input
                id="hash-output"
                readOnly
                value={hashOutput}
                className="font-mono text-xs pr-20 bg-surface-muted select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(hashOutput)}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-surface px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border shadow-2xs"
              >
                {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </FormField>
        </TabsContent>

        {/* TAB 2: FILE CHECKSUM */}
        <TabsContent value="file" className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-border-strong p-6 text-center hover:bg-surface-muted transition-colors">
            <input type="file" id="hash-file-upload" onChange={handleFileUpload} className="hidden" />
            <label
              htmlFor="hash-file-upload"
              className="flex flex-col items-center justify-center cursor-pointer gap-2"
            >
              <Upload size={28} className="text-accent" />
              <span className="text-sm font-semibold text-foreground">
                Select or drop file to compute {algo}
              </span>
              <span className="text-xs text-muted-foreground">
                Files are read locally in chunks via browser memory. Nothing is ever uploaded.
              </span>
            </label>
          </div>

          {fileName && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md bg-surface-muted p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">File: </span>
                  <span className="font-semibold text-foreground">{fileName}</span> ({(fileSize / 1024).toFixed(1)} KB)
                </div>
                {isHashingFile ? (
                  <Badge variant="warning" size="sm">
                    Computing {algo}...
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    Checksum Ready
                  </Badge>
                )}
              </div>

              {fileHash && (
                <FormField label={`Calculated ${algo} Checksum`} id="file-hash-output">
                  <div className="relative">
                    <Input
                      id="file-hash-output"
                      readOnly
                      value={fileHash}
                      className="font-mono text-xs pr-20 bg-surface-muted select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(fileHash)}
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-surface px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border shadow-2xs"
                    >
                      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </FormField>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Hash Verification Section */}
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-accent" />
          Verify Checksum Against Reference Hash
        </h3>

        <FormField
          label="Paste Expected Hash to Verify"
          id="verify-hash"
          helperText="Paste the checksum provided by the software developer or package registry."
        >
          <Input
            id="verify-hash"
            value={verifyHash}
            onChange={(e) => setVerifyHash(e.target.value)}
            placeholder="e.g. 2fd4e1c67a2d28fced849ee1bb76e7391b93eb12..."
            className="font-mono text-xs"
          />
        </FormField>

        {verificationStatus === "match" && (
          <div className="flex items-center gap-2 rounded-md bg-success/10 border border-success/25 p-3 text-xs text-success font-medium">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>Exact Match! The calculated hash perfectly matches your reference checksum.</span>
          </div>
        )}

        {verificationStatus === "mismatch" && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/25 p-3 text-xs text-destructive font-medium">
            <XCircle size={16} className="shrink-0" />
            <span>Mismatch Detected. The hashes do not match — file or text may be corrupted or altered.</span>
          </div>
        )}
      </section>
    </div>
  );
}
