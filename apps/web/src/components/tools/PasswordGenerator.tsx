"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, RefreshCw, Copy, Check, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const WORDLIST = [
  "angkor", "lotus", "temple", "breeze", "mekong", "bamboo", "sunrise", "emerald",
  "shield", "cipher", "orbit", "crystal", "phoenix", "galaxy", "silver", "monsoon",
  "whisper", "timber", "summit", "horizon", "beacon", "glacier", "falcon", "canopy",
  "sapphire", "solitude", "voyage", "harmony", "zenith", "cascade", "radiant", "haven",
  "granite", "echo", "flame", "voyager", "sanctuary", "odyssey", "pinnacle", "thunder",
  "valiant", "wildcat", "mystic", "nebula", "element", "stellar", "matrix", "canyon",
  "feather", "shadow", "spark", "prism", "quarry", "serpent", "vortex", "meadow"
];

export function PasswordGenerator() {
  const [mode, setMode] = useState<"random" | "passphrase">("random");
  const [length, setLength] = useState("16");
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);

  // Passphrase options
  const [wordCount, setWordCount] = useState("4");
  const [separator, setSeparator] = useState("-");
  const [capitalizeWords, setCapitalizeWords] = useState(true);
  const [appendNumber, setAppendNumber] = useState(true);

  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (mode === "random") {
      let chars = "";
      if (includeLower) chars += "abcdefghijklmnopqrstuvwxyz";
      if (includeUpper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (includeNumbers) chars += "0123456789";
      if (includeSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

      if (excludeAmbiguous) {
        chars = chars.replace(/[0O1lI]/g, "");
      }

      if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

      const len = Math.max(8, Math.min(64, parseInt(length, 10) || 16));
      const bytes = new Uint32Array(len);
      crypto.getRandomValues(bytes);
      const res = Array.from(bytes, (b) => chars[b % chars.length]).join("");
      setPassword(res);
    } else {
      const count = Math.max(3, Math.min(8, parseInt(wordCount, 10) || 4));
      const bytes = new Uint32Array(count);
      crypto.getRandomValues(bytes);

      const words = Array.from(bytes, (b) => {
        let w = WORDLIST[b % WORDLIST.length];
        if (capitalizeWords) w = w.charAt(0).toUpperCase() + w.slice(1);
        return w;
      });

      let res = words.join(separator);
      if (appendNumber) {
        const numBytes = new Uint8Array(1);
        crypto.getRandomValues(numBytes);
        res += `${separator}${(numBytes[0] % 90) + 10}`;
      }
      setPassword(res);
    }
  };

  useEffect(() => {
    generate();
  }, [
    mode,
    length,
    includeUpper,
    includeLower,
    includeNumbers,
    includeSymbols,
    excludeAmbiguous,
    wordCount,
    separator,
    capitalizeWords,
    appendNumber,
  ]);

  // Entropy calculation
  const entropyInfo = React.useMemo(() => {
    if (!password) return { bits: 0, label: "None", crackTime: "Instant", color: "destructive" as const };

    let bits = 0;
    if (mode === "random") {
      let poolSize = 0;
      if (includeLower) poolSize += 26;
      if (includeUpper) poolSize += 26;
      if (includeNumbers) poolSize += 10;
      if (includeSymbols) poolSize += 28;
      if (excludeAmbiguous) poolSize -= 5;
      poolSize = Math.max(2, poolSize);
      bits = Math.round(password.length * Math.log2(poolSize));
    } else {
      const words = parseInt(wordCount, 10) || 4;
      bits = Math.round(words * Math.log2(WORDLIST.length) + (appendNumber ? Math.log2(90) : 0));
    }

    let label = "Moderate";
    let crackTime = "Several centuries";
    let color: "destructive" | "warning" | "success" | "accent" = "warning";

    if (bits < 35) {
      label = "Very Weak";
      crackTime = "Under 1 second";
      color = "destructive";
    } else if (bits < 55) {
      label = "Fair";
      crackTime = "A few days to weeks";
      color = "warning";
    } else if (bits < 80) {
      label = "Strong";
      crackTime = "Millions of years";
      color = "success";
    } else {
      label = "Quantum / Ultra-Secure";
      crackTime = "Trillions of years";
      color = "accent";
    }

    return { bits, label, crackTime, color };
  }, [password, mode, includeLower, includeUpper, includeNumbers, includeSymbols, excludeAmbiguous, wordCount, appendNumber]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Security & Cryptography
          </span>
          <h2 className="mt-1 font-display text-lg text-foreground">
            Cryptographic Password & Passphrase Generator
          </h2>
        </div>
        <Badge variant="accent" size="sm">
          Web Crypto API
        </Badge>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === "random" ? "primary" : "outline"}
          size="sm"
          onClick={() => setMode("random")}
        >
          Random Password
        </Button>
        <Button
          variant={mode === "passphrase" ? "primary" : "outline"}
          size="sm"
          onClick={() => setMode("passphrase")}
        >
          Memorable Passphrase
        </Button>
      </div>

      {/* Generated Password Box */}
      <div className="rounded-lg border border-border bg-surface-muted p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Generated Password
          </span>
          <Badge variant={entropyInfo.color} size="sm">
            {entropyInfo.label} ({entropyInfo.bits} bits)
          </Badge>
        </div>

        <div className="rounded-md border border-border bg-surface px-4 py-3 font-mono text-base font-medium text-foreground select-all break-all tracking-wider">
          {password}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-xs text-muted-foreground">
            Estimated brute-force crack time:{" "}
            <span className="font-semibold text-foreground">{entropyInfo.crackTime}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={generate} className="gap-1.5">
              <RefreshCw size={14} />
              Regenerate
            </Button>
            <Button variant="primary" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </div>

      {/* Options */}
      {mode === "random" ? (
        <div className="space-y-4">
          <FormField
            label={`Password Length: ${length} characters`}
            id="pass-length"
            helperText="Recommended: 16+ characters for critical accounts."
          >
            <input
              type="range"
              id="pass-length"
              min={8}
              max={48}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full accent-accent cursor-pointer"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-xs font-medium text-foreground hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={includeUpper}
                onChange={(e) => setIncludeUpper(e.target.checked)}
                className="rounded border-input text-accent focus:ring-ring"
              />
              Uppercase (A-Z)
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-xs font-medium text-foreground hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={includeLower}
                onChange={(e) => setIncludeLower(e.target.checked)}
                className="rounded border-input text-accent focus:ring-ring"
              />
              Lowercase (a-z)
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-xs font-medium text-foreground hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="rounded border-input text-accent focus:ring-ring"
              />
              Numbers (0-9)
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-xs font-medium text-foreground hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="rounded border-input text-accent focus:ring-ring"
              />
              Symbols (!@#$)
            </label>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              className="rounded border-input text-accent focus:ring-ring"
            />
            Exclude ambiguous characters (0, O, 1, l, I)
          </label>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Word Count" id="pass-word-count">
            <Select id="pass-word-count" value={wordCount} onChange={(e) => setWordCount(e.target.value)}>
              <option value="3">3 Words</option>
              <option value="4">4 Words (Recommended)</option>
              <option value="5">5 Words</option>
              <option value="6">6 Words (Ultra-Secure)</option>
            </Select>
          </FormField>

          <FormField label="Word Separator" id="pass-separator">
            <Select id="pass-separator" value={separator} onChange={(e) => setSeparator(e.target.value)}>
              <option value="-">Hyphen (-)</option>
              <option value=".">Period (.)</option>
              <option value="_">Underscore (_)</option>
              <option value=" ">Space ( )</option>
            </Select>
          </FormField>

          <div className="flex flex-col justify-end">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-xs font-medium text-foreground hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={capitalizeWords}
                onChange={(e) => setCapitalizeWords(e.target.checked)}
                className="rounded border-input text-accent focus:ring-ring"
              />
              Capitalize Words
            </label>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-xs font-medium text-foreground hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={appendNumber}
                onChange={(e) => setAppendNumber(e.target.checked)}
                className="rounded border-input text-accent focus:ring-ring"
              />
              Append Random Number
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
