"use client";
import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectItem, SelectLabel } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, RefreshCw, Trash2, Upload } from "lucide-react";
import JSZip from "jszip";
import Papa from "papaparse";
import "./globals.css";

// --- Utility helpers ---
const stopwords = new Set([
  "the", "a", "an", "and", "or", "of", "for", "to", "in", "on", "at",
  "by", "with", "from", "is", "are", "be", "this", "that", "it", "as",
  "your", "you", "me", "my"
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
  const s = new Set(), o = [];
  for (const x of arr) if (!s.has(x)) { s.add(x); o.push(x); }
  return o;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function titleFromFilename(name, { prefix = "", suffix = "", maxLen = 80 }) {
  const base = tokenize(name).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" ");
  let t = `${prefix ? prefix + " " : ""}${base}${suffix ? " " + suffix : ""}`.trim();
  if (t.length > maxLen) t = t.slice(0, maxLen).trim();
  return t;
}

function keywordsFromFilename(name, { extra = [], count = 25, dedupe = true }) {
  const k = tokenize(name);
  const merged = [...k, ...extra.map(e => e.toLowerCase().trim()).filter(Boolean)];
  const final = (dedupe ? uniq(merged) : merged).slice(0, count);
  return final;
}

// --- Component ---
export default function Page() {
  const [titleMax, setTitleMax] = useState(80);
  const [kwCount, setKwCount] = useState(25);
  const [imageType, setImageType] = useState("Vector");
  const [platform, setPlatform] = useState("adobe");
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

  const totalFiles = svgFiles.length + imgFiles.length + vidFiles.length;
  const totalGenerated = generated.svg + generated.img + generated.vid;
  const progress = totalFiles === 0 ? 0 : Math.round((totalGenerated / totalFiles) * 100);

  const DropBox = ({ title }) => (
    <div className="rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-3 min-h-[140px] cursor-pointer hover:shadow-md transition bg-white">
      <Upload className="w-6 h-6" />
      <div>{title}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 border-b bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-xl font-bold">CSVNest Stock Lite — Pro</div>
          <div className="text-xs border rounded-xl px-3 py-1 bg-slate-100">
            Developed By <span className="font-semibold">Anil Chandra Barman</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Controls</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title Length (10–120)</Label>
                <Slider value={[titleMax]} onValueChange={v => setTitleMax(clamp(v[0], 10, 120))} />
                <Badge>{titleMax}</Badge>
              </div>

              <div>
                <Label>Keywords Count (5–50)</Label>
                <Slider value={[kwCount]} onValueChange={v => setKwCount(clamp(v[0], 5, 50))} />
                <Badge>{kwCount}</Badge>
              </div>

              <div>
                <Label>Image Type</Label>
                <Select value={imageType} onValueChange={setImageType}>
                  <SelectLabel>Image Type</SelectLabel>
                  <SelectItem value="Vector">Vector</SelectItem>
                  <SelectItem value="Illustration">Illustration</SelectItem>
                  <SelectItem value="3D Illustration">3D Illustration</SelectItem>
                  <SelectItem value="3D Icon">3D Icon</SelectItem>
                </Select>
              </div>

              <div>
                <Label>CSV For</Label>
                <Tabs value={platform} onValueChange={setPlatform}>
                  <TabsList className="grid grid-cols-5">
                    <TabsTrigger value="adobe">Adobe</TabsTrigger>
                    <TabsTrigger value="freepik">Freepik</TabsTrigger>
                    <TabsTrigger value="shutterstock">Shutterstock</TabsTrigger>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="vecteezy">Vecteezy</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl flex justify-between items-center">
                <Label>Auto Remove Duplicate Keywords</Label>
                <Switch checked={autoDedupe} onCheckedChange={setAutoDedupe} />
              </div>

              <div className="bg-slate-100 p-3 rounded-xl">
                <div className="flex justify-between items-center">
                  <Label>Bulk: Add Keyword Option</Label>
                  <Switch checked={bulkEnabled} onCheckedChange={setBulkEnabled} />
                </div>
                {bulkEnabled && (
                  <Input className="mt-2" value={bulkText} onChange={e => setBulkText(e.target.value)} />
                )}
              </div>

              <div className="bg-slate-100 p-3 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Prefix</Label>
                  <Switch checked={prefixEnabled} onCheckedChange={setPrefixEnabled} />
                </div>
                {prefixEnabled && <Input value={prefix} onChange={e => setPrefix(e.target.value)} />}

                <div className="flex justify-between items-center">
                  <Label>Suffix</Label>
                  <Switch checked={suffixEnabled} onCheckedChange={setSuffixEnabled} />
                </div>
                {suffixEnabled && <Input value={suffix} onChange={e => setSuffix(e.target.value)} />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Upload Files</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DropBox title="SVG" />
                <DropBox title="IMAGE (JPG, PNG)" />
                <DropBox title="VIDEO" />
              </div>
              <div>
                <Label>Progress</Label>
                <Progress value={progress} />
              </div>
            </CardContent>
          </Card>

          <div className="text-xs opacity-80">
            Developed By <span className="font-semibold">Anil Chandra</span> · Follow:{" "}
            <a href="https://www.facebook.com/anil.chandrabarman.3" target="_blank" className="text-blue-600 underline">Facebook</a>
          </div>
        </div>
      </div>
    </div>
  );
}
