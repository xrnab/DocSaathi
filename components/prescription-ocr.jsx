"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, Loader2, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { saveScannedPrescriptions } from "@/actions/records";
import { toast } from "sonner";

export default function PrescriptionOCR({ patientId = null, onSaveSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    
    // Validate image type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, or WEBP).");
      return;
    }

    const MAX_SIZE_MB = 4;
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Please upload an image under ${MAX_SIZE_MB}MB. Current size: ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setFile(selectedFile);
    setError("");
    setMedicines([]);
    
    // Revoke previous URL to prevent memory leaks
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(URL.createObjectURL(selectedFile));
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ocr-prescription", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to parse the prescription image.");
      }

      const data = await response.json();
      
      if (!data.medicines || data.medicines.length === 0) {
        toast.warning("No medicines could be identified. Try uploading a clearer photo.");
      } else {
        toast.success(`Successfully extracted ${data.medicines.length} medicines!`);
      }

      // Convert "unclear" or missing fields to empty strings for better editing UX
      const sanitized = (data.medicines || []).map((m) => ({
        name: m.name === "unclear" ? "" : (m.name || ""),
        dosage: m.dosage === "unclear" ? "" : (m.dosage || ""),
        frequency: m.frequency === "unclear" ? "" : (m.frequency || ""),
        duration: m.duration === "unclear" ? "" : (m.duration || "")
      }));

      setMedicines(sanitized);
    } catch (err) {
      console.error("Scan error:", err);
      setError(err.message || "An error occurred while scanning your prescription photo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const addRow = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const deleteRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validate that at least one medicine has a name
    const validMeds = medicines.filter((m) => m.name.trim() !== "");
    if (validMeds.length === 0) {
      return toast.error("Please enter at least one valid medicine name.");
    }

    setSaving(true);
    try {
      const result = await saveScannedPrescriptions(validMeds, patientId);
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`Prescription saved! Added ${result.count} medicines to records.`);
      
      // Cleanup previews
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview("");
      }
      setFile(null);
      setMedicines([]);

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save scanned prescriptions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upload/Dropzone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        
        {/* Left Side: Upload dropzone */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
            file 
              ? "border-sky-500 bg-sky-50/20 dark:bg-sky-950/10" 
              : "border-slate-200 dark:border-slate-800 hover:border-sky-400 hover:bg-slate-50/50"
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />
          <Upload className="h-8 w-8 text-sky-500 mb-3" />
          <p className="font-bold text-sm text-foreground">
            {file ? "Change Prescription Photo" : "Drop prescription photo here or click to upload"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Accepts JPG, PNG, WEBP files</p>
          
          {file && (
            <Badge variant="secondary" className="mt-3 bg-sky-100 text-sky-700 hover:bg-sky-100 border-none font-bold text-[10px]">
              {file.name}
            </Badge>
          )}
        </div>

        {/* Right Side: Image Preview */}
        {preview ? (
          <div className="border border-border bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-3 flex justify-center items-center h-[180px]">
            <img 
              src={preview} 
              alt="Prescription preview" 
              className="max-h-full max-w-full object-contain rounded-xl shadow-sm"
            />
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-center items-center text-center p-6 h-[180px] text-muted-foreground text-xs">
            <Sparkles className="h-6 w-6 text-slate-300 mb-2" />
            Upload a prescription to preview image
          </div>
        )}
      </div>

      {/* Action Scan Trigger */}
      {file && medicines.length === 0 && !loading && (
        <Button 
          onClick={handleScan}
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold rounded-xl gap-2 shadow-lg shadow-sky-500/10 py-5 cursor-pointer"
        >
          <Sparkles className="h-4 w-4" /> Scan with AI
        </Button>
      )}

      {/* Loading Stream overlay */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-8 bg-sky-50/20 dark:bg-sky-950/10 rounded-2xl border border-sky-100/50 space-y-4">
          <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
          <div className="text-center">
            <h4 className="font-bold text-sm">Reading Prescription...</h4>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs leading-relaxed">
              Analyzing text and handwriting using Groq Llama 4 Scout. Please hold on a moment...
            </p>
          </div>
        </div>
      )}

      {/* Error alert with fallback */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl space-y-3">
          <div className="flex items-start gap-2.5 text-red-800 dark:text-red-300 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold">Scan Error</h4>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button 
              variant="link" 
              onClick={addRow} 
              className="text-xs text-red-700 dark:text-red-400 font-bold p-0 h-auto underline"
            >
              Enter medicines manually
            </Button>
          </div>
        </div>
      )}

      {/* Editable Table Review Area */}
      {medicines.length > 0 && (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> Verify Extracted Medicines
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">Edit any scan inaccuracies before saving to record.</p>
            </div>
            
            <Button 
              onClick={addRow} 
              size="sm" 
              variant="outline"
              className="border-sky-200 text-sky-600 dark:text-sky-400 font-bold rounded-xl h-8 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </Button>
          </div>

          <div className="border border-border/80 rounded-2xl overflow-hidden shadow-xs bg-slate-50/20 dark:bg-slate-900/10">
            <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
              <table className="w-full text-left text-xs font-bold text-slate-500 border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-border text-foreground font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Medicine Name *</th>
                    <th className="p-3">Dosage</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3 text-center w-[50px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {medicines.map((med, index) => (
                    <tr key={index} className="bg-white dark:bg-slate-950/30 hover:bg-slate-50 dark:hover:bg-slate-900/10">
                      <td className="p-2 min-w-[150px]">
                        <Input
                          required
                          value={med.name}
                          onChange={(e) => handleRowChange(index, "name", e.target.value)}
                          placeholder="e.g. Paracetamol"
                          className="bg-transparent border-transparent focus-visible:ring-sky-500 text-xs h-8 text-foreground"
                        />
                      </td>
                      <td className="p-2 min-w-[100px]">
                        <Input
                          value={med.dosage}
                          onChange={(e) => handleRowChange(index, "dosage", e.target.value)}
                          placeholder="e.g. 500mg"
                          className="bg-transparent border-transparent focus-visible:ring-sky-500 text-xs h-8 text-foreground"
                        />
                      </td>
                      <td className="p-2 min-w-[120px]">
                        <Input
                          value={med.frequency}
                          onChange={(e) => handleRowChange(index, "frequency", e.target.value)}
                          placeholder="e.g. Twice daily"
                          className="bg-transparent border-transparent focus-visible:ring-sky-500 text-xs h-8 text-foreground"
                        />
                      </td>
                      <td className="p-2 min-w-[100px]">
                        <Input
                          value={med.duration}
                          onChange={(e) => handleRowChange(index, "duration", e.target.value)}
                          placeholder="e.g. 5 days"
                          className="bg-transparent border-transparent focus-visible:ring-sky-500 text-xs h-8 text-foreground"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Button 
                          onClick={() => deleteRow(index)} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirm Save Actions */}
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md py-5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save All Medicines
          </Button>
        </div>
      )}

    </div>
  );
}
