import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronLeft, Upload, X, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SHOW_PORTRAIT_STEP = false; // Feature flag: set to true to re-enable Step 3 (photo upload)

const BirthDataFormJsx = ({ onSubmit }) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    month: "",
    day: "",
    year: "",
    hour: "12",
    minute: "0",
    city: "",
    nation: "US",
    lat: null,
    lng: null,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Photo upload state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // City autocomplete state
  const [cityQuery, setCityQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (cityQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-places-autocomplete", {
          body: { input: cityQuery },
        });
        if (!error && data?.predictions) {
          setSuggestions(data.predictions);
          setShowSuggestions(true);
        }
      } catch (e) {
        console.error("[BirthDataForm] Autocomplete error:", e);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  }, [cityQuery]);

  const handleSelectCity = async (prediction) => {
    setShowSuggestions(false);
    setCityQuery(prediction.description);
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-detail", {
        body: { place_id: prediction.place_id },
      });
      if (!error && data) {
        setFormData((prev) => ({
          ...prev,
          city: data.city || prediction.description,
          nation: data.nation || prev.nation,
          lat: data.lat,
          lng: data.lng,
        }));
        setCityQuery(data.formatted_address || prediction.description);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.city;
          return next;
        });
      }
    } catch (e) {
      console.error("[BirthDataForm] Place detail error:", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getMaxDaysInMonth = (month, year) => {
    if (!month || month < 1 || month > 12) return 31;
    return new Date(year || 2000, month, 0).getDate();
  };

  const validate = (data) => {
    const errs = {};
    const month = Number(data.month);
    const day = Number(data.day);
    const year = Number(data.year);
    const hour = Number(data.hour);
    const minute = Number(data.minute);

    if (!data.month || month < 1 || month > 12) errs.month = "Enter a valid month (1–12)";
    const maxDay = getMaxDaysInMonth(month, year);
    if (!data.day || day < 1 || day > maxDay) errs.day = `Enter a valid day (1–${maxDay})`;
    if (!data.year || year < 1900 || year > new Date().getFullYear()) errs.year = `Enter a valid year (1900–${new Date().getFullYear()})`;
    if (data.hour === "" || hour < 0 || hour > 23) errs.hour = "Enter a valid hour (0–23)";
    if (data.minute === "" || minute < 0 || minute > 59) errs.minute = "Enter a valid minute (0–59)";
    if (!data.city.trim()) errs.city = "Required";

    return errs;
  };

  // Step-specific validation
  const validateStep1 = () => {
    const errs = {};
    const month = Number(formData.month);
    const day = Number(formData.day);
    const year = Number(formData.year);
    const maxDay = getMaxDaysInMonth(month, year);
    if (!formData.month || month < 1 || month > 12) errs.month = "Enter a valid month (1–12)";
    if (!formData.day || day < 1 || day > maxDay) errs.day = `Enter a valid day (1–${maxDay})`;
    if (!formData.year || year < 1900 || year > new Date().getFullYear()) errs.year = `Enter a valid year (1900–${new Date().getFullYear()})`;
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    const hour = Number(formData.hour);
    const minute = Number(formData.minute);
    if (formData.hour === "" || hour < 0 || hour > 23) errs.hour = "Enter a valid hour (0–23)";
    if (formData.minute === "" || minute < 0 || minute > 59) errs.minute = "Enter a valid minute (0–59)";
    if (!formData.city.trim()) errs.city = "Required";
    return errs;
  };

  const handleChange = (field, value) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    if (touched[field]) {
      setErrors(validate(next));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(formData));
  };

  const handleNext = () => {
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setTouched({ month: true, day: true, year: true });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setTouched((prev) => ({ ...prev, hour: true, minute: true, city: true }));
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Photo handling
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setPhotoError('File must be under 10MB.');
      return;
    }
    setPhotoError(null);
    setPhotoFile(file);
    setUploadedPhotoUrl(null);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);

    // Auto-upload
    uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `portraits/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('user-photos')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(data.path);
      setUploadedPhotoUrl(urlData.publicUrl);
    } catch (err) {
      console.error('[BirthDataForm] Photo upload error:', err);
      setPhotoError('Upload failed. You can still generate without a photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadedPhotoUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  };

  const doSubmit = (withPhoto) => {
    const errs = validate(formData);
    setErrors(errs);
    setTouched({ month: true, day: true, year: true, hour: true, minute: true, city: true });
    if (Object.keys(errs).length === 0) {
      onSubmit({
        name: formData.name.trim(),
        month: Number(formData.month),
        day: Number(formData.day),
        year: Number(formData.year),
        hour: Number(formData.hour),
        minute: Number(formData.minute),
        city: formData.city.trim(),
        nation: formData.nation.trim() || "US",
        lat: formData.lat,
        lng: formData.lng,
        userPhotoUrl: withPhoto ? uploadedPhotoUrl : null,
      });
    }
  };

  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
      errors[field] && touched[field] ? "border-destructive" : "border-border"
    }`;

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className="rounded-full transition-all duration-300"
          style={{
            width: s === step ? 24 : 8,
            height: 8,
            backgroundColor: s === step ? 'hsl(var(--primary))' : s < step ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          }}
        />
      ))}
    </div>
  );

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6 w-full max-w-md mx-auto" style={{ maxWidth: '28rem' }}>
      {/* Step indicator */}
      <StepIndicator />

      {/* Back arrow for steps 2 & 3 */}
      {step > 1 && (
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl text-foreground tracking-wide mb-2">
          {step === 1 && "Enter Your Birth Information"}
          {step === 2 && "Time & Location"}
          {step === 3 && "Add Your Face to the Artwork"}
        </h2>
        <p className="text-muted-foreground text-sm font-body">
          {step === 1 && "We'll use this to create your personalized birth chart artwork"}
          {step === 2 && "Help us pinpoint the exact sky at your birth"}
          {step === 3 && "Upload a clear photo and your face will be woven into the cosmic portrait."}
        </p>
        {step === 3 && (
          <span className="inline-block mt-2 text-xs font-body px-2 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            Optional
          </span>
        )}
      </div>

      {/* =================== STEP 1: Name + Birth Date =================== */}
      {step === 1 && (
        <>
          {/* Name (optional) */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 font-body uppercase tracking-wide">
              Name <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Your name"
              className={inputClass("name")}
              maxLength={100}
            />
          </div>

          {/* Date: Month / Day / Year */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 font-body uppercase tracking-wide">
              Birth Date
            </label>
            {isMobile ? (
              <div>
                <input
                  type="date"
                  value={
                    formData.year && formData.month && formData.day
                      ? `${String(formData.year).padStart(4, '0')}-${String(formData.month).padStart(2, '0')}-${String(formData.day).padStart(2, '0')}`
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const [y, m, d] = val.split("-");
                      setFormData((prev) => ({ ...prev, year: y, month: String(Number(m)), day: String(Number(d)) }));
                      setErrors(validate({ ...formData, year: y, month: String(Number(m)), day: String(Number(d)) }));
                    }
                  }}
                  max={`${new Date().getFullYear()}-12-31`}
                  min="1900-01-01"
                  className={inputClass("month")}
                />
                {(errors.month || errors.day || errors.year) && (touched.month || touched.day || touched.year) && (
                  <p className="text-destructive text-xs mt-1">Please select a valid date</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { field: "month", placeholder: "MM", min: 1, max: 12 },
                  { field: "day", placeholder: "DD", min: 1, max: 31 },
                  { field: "year", placeholder: "YYYY", min: 1900, max: new Date().getFullYear() },
                ].map(({ field, placeholder, min, max }) => (
                  <div key={field}>
                    <input
                      type="number"
                      value={formData[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      onBlur={() => handleBlur(field)}
                      placeholder={placeholder}
                      min={min}
                      max={max}
                      className={inputClass(field)}
                    />
                    {errors[field] && touched[field] && (
                      <p className="text-destructive text-xs mt-1">{errors[field]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="btn-base btn-primary w-full"
          >
            Next
          </button>
        </>
      )}

      {/* =================== STEP 2: Time + City + Country =================== */}
      {step === 2 && (
        <>
          {/* Time: Hour / Minute */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 font-body uppercase tracking-wide">
              Birth Time {!isMobile && <span className="text-muted-foreground/50">(24-hour format)</span>}
            </label>
            {isMobile ? (
              <div>
                <input
                  type="time"
                  value={`${String(formData.hour).padStart(2, '0')}:${String(formData.minute).padStart(2, '0')}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      const [h, m] = val.split(":");
                      setFormData((prev) => ({ ...prev, hour: String(Number(h)), minute: String(Number(m)) }));
                    }
                  }}
                  className={inputClass("hour")}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { field: "hour", placeholder: "HH", min: 0, max: 23 },
                  { field: "minute", placeholder: "MM", min: 0, max: 59 },
                ].map(({ field, placeholder, min, max }) => (
                  <div key={field}>
                    <input
                      type="number"
                      value={formData[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      onBlur={() => handleBlur(field)}
                      placeholder={placeholder}
                      min={min}
                      max={max}
                      className={inputClass(field)}
                    />
                    {errors[field] && touched[field] && (
                      <p className="text-destructive text-xs mt-1">{errors[field]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-muted-foreground/60 text-xs mt-2 font-body">
              If you don't know your exact birth time, use 12:00 noon
            </p>
          </div>

          {/* City — with Google Places Autocomplete */}
          <div ref={wrapperRef} className="relative">
            <label className="block text-sm font-medium text-muted-foreground mb-2 font-body uppercase tracking-wide">
              Birth City
            </label>
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setFormData((prev) => ({ ...prev, city: "", lat: null, lng: null }));
              }}
              onBlur={() => handleBlur("city")}
              placeholder="Start typing a city name..."
              className={inputClass("city")}
              maxLength={200}
              autoComplete="off"
            />
            {loadingSuggestions && (
              <div className="absolute right-3 top-[38px]">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((s) => (
                  <li
                    key={s.place_id}
                    onClick={() => handleSelectCity(s)}
                    className="px-4 py-3 text-sm text-foreground hover:bg-accent cursor-pointer transition-colors"
                  >
                    {s.description}
                  </li>
                ))}
              </ul>
            )}
            {errors.city && touched.city && (
              <p className="text-destructive text-xs mt-1">{errors.city}</p>
            )}
            {formData.lat && (
              <p className="text-muted-foreground/60 text-xs mt-1 font-body">
                📍 {formData.city}, {formData.nation}
              </p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 font-body uppercase tracking-wide">
              Country
            </label>
            <input
              type="text"
              value={formData.nation}
              onChange={(e) => handleChange("nation", e.target.value)}
              placeholder="US"
              className={inputClass("nation")}
              maxLength={100}
            />
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="btn-base btn-primary w-full"
          >
            Next
          </button>
        </>
      )}

      {/* =================== STEP 3: Photo Upload =================== */}
      {step === 3 && (
        <>
          {/* Upload zone */}
          {!photoFile ? (
            <div
              ref={dropZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary hover:bg-accent/30"
              style={{ borderColor: 'hsl(var(--border))' }}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-body text-foreground mb-1">
                Click to browse or drag & drop
              </p>
              <p className="text-xs font-body text-muted-foreground">
                JPG, PNG, or WEBP · Max 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 border rounded-xl" style={{ borderColor: 'hsl(var(--border))' }}>
              {photoUploading ? (
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <img
                  src={photoPreview}
                  alt="Your photo"
                  className="w-16 h-16 rounded-full object-cover shrink-0 border-2"
                  style={{ borderColor: 'hsl(var(--primary))' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body text-foreground truncate">{photoFile.name}</p>
                <p className="text-xs font-body text-muted-foreground">
                  {photoUploading ? 'Uploading…' : uploadedPhotoUrl ? 'Ready ✓' : 'Upload failed'}
                </p>
              </div>
              <button
                type="button"
                onClick={removePhoto}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {photoError && (
            <p className="text-destructive text-xs">{photoError}</p>
          )}

          {/* Submit CTAs */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => doSubmit(true)}
              disabled={photoUploading || (!uploadedPhotoUrl && !!photoFile)}
              className="btn-base btn-primary w-full disabled:opacity-50"
            >
              Generate My Artwork
            </button>
            <button
              type="button"
              onClick={() => doSubmit(false)}
              className="w-full text-sm font-body text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Skip — generate without photo
            </button>
          </div>
        </>
      )}
    </form>
  );
};

export default BirthDataFormJsx;
