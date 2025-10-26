
"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, RefreshCw, Trash2, Upload } from "lucide-react";
import JSZip from "jszip";
import Papa from "papaparse";
import "./globals.css";

const stopwords = new Set([
  "the","a","an","and","or","of","for","to","in","on","at","by","with","from","is","are","be","this","that","it","as","your","you","me","my"
]);

function tokenize(name) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !stopwords.has(t));
}

function uniq(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function titleFromFilename(name, { prefix = "", suffix = "", maxLen = 80 }) {
  const base = tokenize(name)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(" ");
  let t = `${prefix ? prefix + " " : ""}${base}${suffix ? " " + suffix : ""}`.trim();
  if (t.length > maxLen) t = t.slice(0, maxLen).trim();
  return t;
}

function keywordsFromFilename(name, { extra = [], count = 25, dedupe = true }) {
  const k = tokenize(name);
  const merged = [...k, ...extra.map((e) => e.toLowerCase().trim()).filter(Boolean)];
  const final = (dedupe ? uniq(merged) : merged).slice(0, count);
  return final;
}

function toCSVRows(files, platform, options) {
  const rows = [];
  for (const f of files) {
    const baseTitle = titleFromFilename(f.name, {
      prefix: options.prefixEnabled ? options.prefix : "",
      suffix: options.suffixEnabled ? options.suffix : "",
      maxLen: options.titleMax,
    });

    const kws = keywordsFromFilename(f.name, {
      extra: options.bulkEnabled ? options.bulkKeywords : [],
      count: options.kwCount,
      dedupe: options.autoDedupe,
    });

    switch (platform) {
      case "adobe":
        rows.push({ Filename: f.name, Title: baseTitle, Keywords: kws.join(", "), ImageType: options.imageType });
        break;
      case "freepik":
        rows.push({ Filename: f.name, Title: baseTitle, Tags: kws.join(", "), ImageType: options.imageType });
        break;
      case "shutterstock":
        rows.push({ Filename: f.name, Title: baseTitle, Keywords: kws.join(", "), ImageType: options.imageType });
        break;
      case "vecteezy":
        rows.push({ Filename: f.name, Title: baseTitle, Tags: kws.join(", "), ImageType: options.imageType });
        break;
      default:
        rows.push({ Filename: f.name, Title: baseTitle, Keywords: kws.join(", "), ImageType: options.imageType });
    }
  }
  return rows;
}

export default function Page() {
  const [platform, setPlatform] = useState("adobe");
  const [imageType, setImageType] = useState("None");
  const [titleMax, setTitleMax] = useState(80);
  const [kwCount, setKwCount] = useState(25);

  const [autoDedupe, setAutoDedupe] = useState(true);

  const [bulkEnabled, setBulkEnabled] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const [prefixEnabled, setPrefixEnabled] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [suffixEnabled, setSuffixEnabled] = useState(false);
  const [suffix, setSuffix] = useState("");

  const [svgFiles, setSvgFiles] = useState([]);
  const [imgFiles, setImgFiles] = useState([]);
  const [vidFiles, setVidFiles] = useState([]);

  const [generated, setGenerated] = useState({ svg: 0, img: 0, vid: 0 });
  const [failed, setFailed] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRefs = {
    svg: useRef(null),
    img: useRef(null),
    vid: useRef(null),
  };

  const totalFiles = svgFiles.length + imgFiles.length + vidFiles.length;
  const totalGenerated = generated.svg + generated.img + generated.vid;
  const progress = totalFiles === 0 ? 0 : Math.round((totalGenerated / totalFiles) * 100);

  const bulkKeywords = useMemo(() =>
    bulkText
      .split(/[,\n]/g)
      .map((s) => s.trim())
      .filter(Boolean),
    [bulkText]
  );

  const commonOptions = useMemo(() => ({
    titleMax,
    kwCount,
    imageType,
    autoDedupe,
    bulkEnabled,
    bulkKeywords,
    prefixEnabled,
    prefix,
    suffixEnabled,
    suffix,
  }), [titleMax, kwCount, imageType, autoDedupe, bulkEnabled, bulkKeywords, prefixEnabled, prefix, suffixEnabled, suffix]);

  const onDrop = useCallback((kind, files) => {
    const arr = Array.from(files).slice(0, 1000);
    const items = arr.map((f) => ({ name: f.name, size: f.size, type: f.type }));
    if (kind === "svg") setSvgFiles((prev) => uniq([...prev, ...items]));
    if (kind === "img") setImgFiles((prev) => uniq([...prev, ...items]));
    if (kind === "vid") setVidFiles((prev) => uniq([...prev, ...items]));
  }, []);

  const handleBrowse = (kind) => fileInputRefs[kind].current?.click();

  const handleClearAll = () => {
    setSvgFiles([]); setImgFiles([]); setVidFiles([]);
    setGenerated({ svg: 0, img: 0, vid: 0 }); setFailed(0);
  };

  const simulateWork = async (count, tick) => {
    for (let i = 0; i < count; i++) {
      await new Promise((r) => setTimeout(r, 8));
      tick(i + 1);
    }
  };

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    setGenerated({ svg: 0, img: 0, vid: 0 });
    setFailed(0);
    try {
      await simulateWork(svgFiles.length, (n) => setGenerated((g) => ({ ...g, svg: n })));
      await simulateWork(imgFiles.length, (n) => setGenerated((g) => ({ ...g, img: n })));
      await simulateWork(vidFiles.length, (n) => setGenerated((g) => ({ ...g, vid: n })));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    const zip = new JSZip();

    const svgRows = toCSVRows(svgFiles, platform, commonOptions);
    const imgRows = toCSVRows(imgFiles, platform, commonOptions);
    const vidRows = toCSVRows(vidFiles, platform, commonOptions);

    const allRows = [...svgRows, ...imgRows, ...vidRows];

    const csvSVG = Papa.unparse(allRows);
    const csvEPS = Papa.unparse(allRows.map((r) => ({ ...r, Filename: r.Filename.replace(/\.[^.]+$/, ".eps") })));
    const csvAI = Papa.unparse(allRows.map((r) => ({ ...r, Filename: r.Filename.replace(/\.[^.]+$/, ".ai") })));

    zip.file("SVG_CSV.csv", csvSVG);
    zip.file("EPS_CSV.csv", csvEPS);
    zip.file("AI_CSV.csv", csvAI);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `metadata_csv_${platform}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const DropBox = ({ kind, title, hint }) => (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDrop(kind, e.dataTransfer.files); }}
      className={`rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-3 min-h-[140px] cursor-pointer hover:shadow-md transition ${
        kind === "svg" ? "bg-emerald-50" : kind === "img" ? "bg-sky-50" : "bg-fuchsia-50"
      }`}
      onClick={() => handleBrowse(kind)}
    >
      <Upload className="w-6 h-6" />
      <div className="font-semibold">{title}</div>
      <div className="text-xs opacity-70 text-center max-w-[360px]">{hint}</div>
      <div className="text-[11px] opacity-60">Drop files here or click to browse</div>
      <input
        ref={fileInputRefs[kind]}
        type="file"
        multiple
        className="hidden"
        accept={kind === "svg" ? ".svg" : kind === "img" ? ".jpg,.jpeg,.png" : ".mp4,.mov,.avi,.webm"}
        onChange={(e) => onDrop(kind, e.target.files)}
      />
    </div>
  );

  const FileList = ({ items, label }) => (
    <Card className="shadow-sm">
      <CardHeader className="py-3">
        <CardTitle className="text-base">{label} <Badge variant="secondary" className="ml-2">{items.length}</Badge></CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-40 rounded-md border p-2 bg-white">
          {items.length === 0 ? (
            <div className="text-xs opacity-60">No files</div>
          ) : (
            <ul className="space-y-1 text-sm">
              {items.map((f, i) => (
                <li key={f.name + i} className="flex items-center justify-between gap-3">
                  <span className="truncate max-w-[75%]">{f.name}</span>
                  <span className="text-xs opacity-60">{(f.size / 1024).toFixed(0)} KB</span>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight">CSVNest Stock Lite — Pro</div>
          <div className="text-xs">
            <div className="border rounded-xl px-3 py-1 bg-slate-100">Developed By <span className="font-semibold">Anil Chandra Barman</span></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Title Length <span className="opacity-60">(10–120)</span></Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Slider
                      value={[titleMax]}
                      onValueChange={(v) => setTitleMax(clamp(v[0], 10, 120))}
                      min={10} max={120} step={1}
                    />
                    <Badge variant="outline">{titleMax}</Badge>
                  </div>
                </div>

                <div>
                  <Label>Keywords Count <span className="opacity-60">(5–50)</span></Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Slider
                      value={[kwCount]}
                      onValueChange={(v) => setKwCount(clamp(v[0], 5, 50))}
                      min={5} max={50} step={1}
                    />
                    <Badge variant="outline">{kwCount}</Badge>
                  </div>
                </div>

                <div>
                  <Label>Image Type</Label>
                  <Select value={imageType} onValueChange={setImageType}>
                    <SelectLabel>Image Type</SelectLabel>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Vector">Vector</SelectItem>
                    <SelectItem value="Illustration">Illustration</SelectItem>
                    <SelectItem value="3D Illustration">3D Illustration</SelectItem>
                    <SelectItem value="3D Icon">3D Icon</SelectItem>
                  </Select>
                </div>

                <div>
                  <Label>CSV For</Label>
                  <Tabs className="mt-2" value={platform} onValueChange={setPlatform}>
                    {({ value, onValueChange }) => (
                      <>
                        <TabsList className="grid grid-cols-5">
                          <TabsTrigger value="adobe" current={value} onClick={() => onValueChange("adobe")}>Adobe Stock</TabsTrigger>
                          <TabsTrigger value="freepik" current={value} onClick={() => onValueChange("freepik")}>Freepik</TabsTrigger>
                          <TabsTrigger value="shutterstock" current={value} onClick={() => onValueChange("shutterstock")}>Shutterstock</TabsTrigger>
                          <TabsTrigger value="general" current={value} onClick={() => onValueChange("general")}>General</TabsTrigger>
                          <TabsTrigger value="vecteezy" current={value} onClick={() => onValueChange("vecteezy")}>Vecteezy</TabsTrigger>
                        </TabsList>
                      </>
                    )}
                  </Tabs>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-100">
                  <div>
                    <Label className="mb-0">Auto Remove Duplicate Keywords</Label>
                    <div className="text-xs opacity-70">Same keywords will be kept once</div>
                  </div>
                  <Switch checked={autoDedupe} onCheckedChange={setAutoDedupe} />
                </div>

                <div className="p-3 rounded-xl bg-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="mb-0">Bulk: Add Keyword Option</Label>
                    <Switch checked={bulkEnabled} onCheckedChange={setBulkEnabled} />
                  </div>
                  {bulkEnabled && (
                    <div className="mt-2 space-y-2">
                      <div className="text-xs opacity-70">Add keywords (comma or newline separated). They will be merged with auto-generated keywords.</div>
                      <Input value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="e.g., minimal, flat, vector, christmas" />
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="mb-0">Prefix</Label>
                    <Switch checked={prefixEnabled} onCheckedChange={setPrefixEnabled} />
                  </div>
                  {prefixEnabled && (
                    <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g., Premium" />
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="mb-0">Suffix</Label>
                    <Switch checked={suffixEnabled} onCheckedChange={setSuffixEnabled} />
                  </div>
                  {suffixEnabled && (
                    <Input value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="e.g., Vector Pack" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Upload Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DropBox
                  kind="svg"
                  title="SVG"
                  hint="Supports common image, video, and SVG formats. Max 1000 files. SVG uploads enable multi-format (EPS, AI) metadata CSV export."
                />
                <DropBox
                  kind="img"
                  title="IMAGE (JPG, PNG)"
                  hint="Supports common image, video, and SVG formats. Max 1000 files. SVG uploads enable multi-format (EPS, AI) metadata CSV export."
                />
                <DropBox
                  kind="vid"
                  title="VIDEO"
                  hint="Supports common image, video, and SVG formats. Max 1000 files. SVG uploads enable multi-format (EPS, AI) metadata CSV export."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FileList items={svgFiles} label="SVG Files" />
                <FileList items={imgFiles} label="Image Files" />
                <FileList items={vidFiles} label="Video Files" />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="destructive" onClick={handleClearAll}>
                  <Trash2 className="w-4 h-4" /> <span className="ml-2">Clear All</span>
                </Button>
                <Button onClick={handleGenerateAll} disabled={totalFiles === 0 || isGenerating}>
                  <RefreshCw className="w-4 h-4" /> <span className="ml-2">Generate All</span>
                </Button>
                <Button onClick={handleExport} variant="secondary" disabled={totalFiles === 0}>
                  <Download className="w-4 h-4" /> <span className="ml-2">Export CSV (ZIP)</span>
                </Button>
                <div className="ml-auto flex items-center gap-2 text-xs">
                  <Badge variant="secondary">Uploaded: {totalFiles}</Badge>
                  <Badge variant="outline">CSV Success: {totalGenerated}</Badge>
                  <Badge variant="destructive">Failed: {failed}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Progress</Label>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Live Metadata Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs opacity-70 mb-2">Preview shows how titles & keywords will look for the selected platform.</div>
              <div className="space-y-3">
                {[...svgFiles, ...imgFiles, ...vidFiles].slice(0, 8).map((f, idx) => {
                  const t = titleFromFilename(f.name, {
                    prefix: prefixEnabled ? prefix : "",
                    suffix: suffixEnabled ? suffix : "",
                    maxLen: titleMax,
                  });
                  const kws = keywordsFromFilename(f.name, {
                    extra: bulkEnabled ? bulkKeywords : [],
                    count: kwCount,
                    dedupe: autoDedupe,
                  });
                  return (
                    <div key={f.name + idx} className="rounded-xl border p-3 bg-white">
                      <div className="text-sm font-medium truncate">{t}</div>
                      <div className="text-xs opacity-70 mt-1 truncate">{kws.join(", ")}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline">{platform}</Badge>
                        <Badge variant="secondary">{imageType}</Badge>
                        <Badge variant="outline">{f.name}</Badge>
                      </div>
                    </div>
                  );
                })}
                {[svgFiles, imgFiles, vidFiles].every((arr) => arr.length === 0) && (
                  <div className="text-xs opacity-60">No items to preview yet. Upload files to see live metadata.</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Short Guide</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>1) Select <span className="font-medium">CSV For</span> platform.</div>
              <div>2) Adjust <span className="font-medium">Title Length</span> & <span className="font-medium">Keywords Count</span>.</div>
              <div>3) Toggle <span className="font-medium">Bulk Keywords</span> / <span className="font-medium">Prefix</span> / <span className="font-medium">Suffix</span> if needed.</div>
              <div>4) Drag files into SVG / IMAGE / VIDEO boxes.</div>
              <div>5) Click <span className="font-medium">Generate All</span> then <span className="font-medium">Export CSV (ZIP)</span>.</div>
            </CardContent>
          </Card>

          <div className="text-xs opacity-80">
            Developed By <span className="font-semibold">Anil Chandra</span> · Follow: <a className="text-blue-600 underline" href="https://www.facebook.com/anil.chandrabarman.3" target="_blank" rel="noreferrer">Facebook</a>
          </div>
        </div>
      </div>
    </div>
  );
}
