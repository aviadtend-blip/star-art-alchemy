import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import PopularTag from "@/components/ui/PopularTag";
import PrimaryButton from "@/components/ui/PrimaryButton";

const INPUT_CLASS = "w-full bg-transparent border-0 border-b border-white/20 rounded-none px-0 py-3 text-lg text-left text-foreground placeholder:text-[#B1B1B1] focus:border-primary focus:ring-0 transition outline-none";

export default function BirthDataFormCard({
  formData,
  setFormData,
  onSubmit,
  submitLabel = "Continue",
  gap = 24,
  inline = false,
  onStepChange,
}) {
  const [showTimeStep, setShowTimeStep] = useState(false);
  const [birthHour, setBirthHour] = useState("12");
  const [birthMinute, setBirthMinute] = useState("00");
  const [birthAmPm, setBirthAmPm] = useState("AM");
  const [dontKnowTime, setDontKnowTime] = useState(false);
  const [locationError, setLocationError] = useState(false);

  // Photo step state
  const [showPhotoStep, setShowPhotoStep] = useState(false);

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(showPhotoStep ? 'photo' : showTimeStep ? 'time' : 'date');
  }, [showPhotoStep, showTimeStep]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);
  const pendingSubmitRef = useRef(null);

  // City autocomplete
  const [cityQuery, setCityQuery] = useState(formData.birthCity || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const skipAutocompleteRef = useRef(false);

  useEffect(() => {
    if (formData.birthCity && formData.birthCity !== cityQuery) {
      setCityQuery(formData.birthCity);
    }
  }, [formData.birthCity]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, []);

  useEffect(() => {
    if (skipAutocompleteRef.current) { skipAutocompleteRef.current = false; return; }
    if (cityQuery.length < 2) { setSuggestions([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-places-autocomplete", { body: { input: cityQuery } });
        if (!error && data?.predictions) { setSuggestions(data.predictions); setShowSuggestions(true); }
      } catch (e) { console.error("[BirthDataFormCard] Autocomplete error:", e); }
      finally { setLoadingSuggestions(false); }
    }, 300);
  }, [cityQuery]);

  const handleSelectCity = async (prediction) => {
    setShowSuggestions(false);
    skipAutocompleteRef.current = true;
    setCityQuery(prediction.description);
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-detail", { body: { place_id: prediction.place_id } });
      if (!error && data) {
        setFormData((prev) => ({ ...prev, birthCity: data.city || prediction.description, birthCountry: data.nation || prev.birthCountry, lat: data.lat, lng: data.lng }));
        skipAutocompleteRef.current = true;
        setCityQuery(data.formatted_address || prediction.description);
      }
    } catch (e) { console.error("[BirthDataFormCard] Place detail error:", e); }
    finally { setLoadingSuggestions(false); }
  };

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleStep1aSubmit = (e) => {
    e.preventDefault();
    if (!formData.lat || !formData.birthCity) {
      setLocationError(true);
      return;
    }
    setLocationError(false);
    setShowTimeStep(true);
  };

  const handleStep1bSubmit = () => {
    let hour = 12;
    let minute = 0;
    if (!dontKnowTime) {
      hour = Number(birthHour);
      minute = Number(birthMinute);
      if (birthAmPm === "PM" && hour !== 12) hour += 12;
      if (birthAmPm === "AM" && hour === 12) hour = 0;
    }
    pendingSubmitRef.current = {
      name: formData.name,
      month: formData.birthMonth,
      day: formData.birthDay,
      year: formData.birthYear,
      hour: String(hour),
      minute: String(minute),
      city: formData.birthCity,
      nation: formData.birthCountry,
      lat: formData.lat,
      lng: formData.lng,
    };
    setShowPhotoStep(true);
  };

  // ── Photo handlers ──
  const handlePhotoSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { setPhotoError('Photo must be under 10MB'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `portraits/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('user-photos').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(data.path);
      setUploadedPhotoUrl(urlData.publicUrl);
    } catch (err) {
      setPhotoError('Upload failed. You can still generate without a photo.');
      setUploadedPhotoUrl(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadedPhotoUrl(null);
    setPhotoError(null);
  };

  const handleSubmitWithPhoto = () => {
    onSubmit({ ...pendingSubmitRef.current, userPhotoUrl: uploadedPhotoUrl });
  };

  const handleSubmitWithoutPhoto = () => {
    onSubmit({ ...pendingSubmitRef.current, userPhotoUrl: null });
  };

  const dateValue =
    formData.birthYear && formData.birthMonth && formData.birthDay
      ? `${String(formData.birthYear).padStart(4, '0')}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`
      : "";

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val) {
      const [y, m, d] = val.split("-");
      set("birthYear", y);
      set("birthMonth", String(Number(m)));
      set("birthDay", String(Number(d)));
    }
  };

  // ═══════════════════════════════════════════
  // Step 3: Photo upload
  // ═══════════════════════════════════════════
  if (showPhotoStep) {
    return (
      <div className="flex flex-col" style={{ gap }}>
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <label className="block text-subtitle tracking-[3px]" style={{ color: '#FFFFFF' }}>ADD YOUR FACE TO THE ARTWORK</label>
            <PopularTag>optional</PopularTag>
          </div>
          <p className="text-body" style={{ color: '#B1B1B1' }}>
            Upload a clear photo and your face will be woven into the cosmic portrait.
          </p>
        </div>

        {/* Upload zone or preview */}
        {!photoFile ? (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 cursor-pointer transition hover:border-white/40 py-6 px-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePhotoSelect(f); }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6A6A6A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-body text-foreground">Click to browse or drag & drop</span>
            <span className="text-body" style={{ color: '#6A6A6A', fontSize: '13px' }}>JPG, PNG, WEBP — max 10MB</span>
          </div>
        ) : photoUploading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/20 py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-body text-foreground">Uploading…</span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
              <img src={photoPreview} alt="Your photo" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body text-foreground truncate">{photoFile.name}</p>
              <button type="button" onClick={handleRemovePhoto} className="text-body mt-1" style={{ color: '#B1B1B1', textDecoration: 'underline', fontSize: '13px' }}>
                Remove
              </button>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }} />

        {photoError && <p className="text-body text-red-400">{photoError}</p>}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <PrimaryButton
            onClick={handleSubmitWithPhoto}
            disabled={photoUploading || !uploadedPhotoUrl}
            className="w-full"
          >
            Generate My Artwork
          </PrimaryButton>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowPhotoStep(false); setShowTimeStep(true); }}
              className="flex-1 h-12 rounded-full text-foreground text-a5 font-body transition hover:bg-white/10"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmitWithoutPhoto}
              className="flex-1 h-12 rounded-full border border-white/30 text-foreground text-a5 font-body transition hover:bg-white/10"
            >
              Skip — generate without photo
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Step 1b: Birth time
  // ═══════════════════════════════════════════
  if (showTimeStep) {
    const nativeHour24 = (() => {
      let h = Number(birthHour) || 12;
      if (birthAmPm === 'PM' && h !== 12) h += 12;
      if (birthAmPm === 'AM' && h === 12) h = 0;
      return h;
    })();
    const nativeTimeValue = `${String(nativeHour24).padStart(2, '0')}:${String(birthMinute).padStart(2, '0')}`;

    const handleNativeTimeChange = (e) => {
      const val = e.target.value;
      if (!val) return;
      const [h, m] = val.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      setBirthHour(String(h12));
      setBirthMinute(String(m).padStart(2, '0'));
      setBirthAmPm(ampm);
    };

    const checkboxEl = (
      <div className="flex items-start gap-3">
        <div
          className="w-5 h-5 mt-0.5 rounded flex items-center justify-center flex-shrink-0 cursor-pointer border border-white/10"
          style={{ backgroundColor: dontKnowTime ? '#FFFFFF' : '#2C2C2C' }}
          onClick={() => setDontKnowTime(!dontKnowTime)}
        >
          {dontKnowTime && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#191919" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </div>
        <input type="checkbox" checked={dontKnowTime} onChange={(e) => setDontKnowTime(e.target.checked)} className="sr-only" />
        <div>
          <span className="text-a5 text-foreground">I don't know my birth time</span>
          {dontKnowTime && (
            <p className="text-body mt-1" style={{ color: '#6A6A6A' }}>
              No worries! Your artwork will still be deeply personal and beautifully accurate.
            </p>
          )}
        </div>
      </div>
    );

    const timeInputsDesktop = (
      <div className={`flex items-end gap-4 transition-opacity ${dontKnowTime ? 'opacity-20 pointer-events-none' : ''}`}>
        <div className="flex-1 min-w-0">
          <input type="text" inputMode="numeric" maxLength={2} value={birthHour}
            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); if (v === '' || (Number(v) >= 0 && Number(v) <= 12)) setBirthHour(v); }}
            placeholder="12" className={INPUT_CLASS} />
        </div>
        <div className="flex-1 min-w-0">
          <input type="text" inputMode="numeric" maxLength={2} value={birthMinute}
            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); if (v === '' || (Number(v) >= 0 && Number(v) <= 59)) setBirthMinute(v); }}
            placeholder="00" className={INPUT_CLASS} />
        </div>
        <div className="flex-1 min-w-0 relative">
          <select value={birthAmPm} onChange={(e) => setBirthAmPm(e.target.value)}
            className={`${INPUT_CLASS} appearance-none cursor-pointer pr-6`}>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
          <svg className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );

    const timeInputMobile = (
      <div className={`transition-opacity ${dontKnowTime ? 'opacity-20 pointer-events-none' : ''}`}>
        <input type="time" value={nativeTimeValue} onChange={handleNativeTimeChange} className={INPUT_CLASS} />
      </div>
    );

    return (
      <div className="flex flex-col" style={{ gap }}>
        <div>
          <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#FFFFFF' }}>BIRTH TIME</label>
          <div className="hidden md:block">
            <div className="flex items-end gap-4">
              <div className="flex-1 min-w-0">{timeInputsDesktop}</div>
              <PrimaryButton onClick={handleStep1bSubmit} className="flex-shrink-0">
                Continue
              </PrimaryButton>
            </div>
          </div>
          <div className="md:hidden flex flex-col gap-6">
            {timeInputMobile}
            {checkboxEl}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowTimeStep(false)} className="flex-1 h-12 rounded-full border border-white/30 text-foreground text-a5 font-body transition hover:bg-white/10">
                Back
              </button>
              <PrimaryButton onClick={handleStep1bSubmit} className="flex-1">
                Continue
              </PrimaryButton>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-start justify-between">
          {checkboxEl}
          <button type="button" onClick={() => setShowTimeStep(false)} className="link-a5 font-body text-foreground py-0 flex-shrink-0" style={{ textDecoration: 'underline' }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Step 1a: Date + Location (inline variant)
  // ═══════════════════════════════════════════
  if (inline) {
    return (
      <form onSubmit={handleStep1aSubmit} className="flex items-end gap-6">
        <div className="flex-1 min-w-0">
          <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#FFFFFF' }}>BIRTH DATE</label>
          <div className="relative">
            <input type="date" required value={dateValue} onChange={handleDateChange} max={`${new Date().getFullYear()}-12-31`} min="1900-01-01" placeholder="mm/dd/yyyy" data-empty={!dateValue ? "true" : undefined} className={`${INPUT_CLASS} date-no-icon`} />
          </div>
        </div>
        <div ref={wrapperRef} className="relative flex-1 min-w-0">
          <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#FFFFFF' }}>BIRTH LOCATION</label>
          <div className="relative">
            <input type="text" required value={cityQuery} onChange={(e) => { setCityQuery(e.target.value); setLocationError(false); setFormData((prev) => ({ ...prev, birthCity: "", lat: null, lng: null })); }} placeholder="City" className={`${INPUT_CLASS} ${locationError ? 'border-red-500' : ''}`} autoComplete="off" />
            {loadingSuggestions && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.place_id} onPointerDown={(e) => { e.preventDefault(); handleSelectCity(s); }} className="px-4 py-3 text-body text-foreground hover:bg-primary/10 cursor-pointer transition-colors">
                  {s.description}
                </li>
              ))}
            </ul>
          )}
          {locationError && !formData.lat && <p className="text-body text-red-400 mt-2 absolute">Please select a city from the dropdown</p>}
        </div>
        <PrimaryButton type="submit" className="flex-shrink-0 whitespace-nowrap">
          {submitLabel}
        </PrimaryButton>
      </form>
    );
  }

  // ═══════════════════════════════════════════
  // Step 1a: Date + Location (default)
  // ═══════════════════════════════════════════
  return (
    <form onSubmit={handleStep1aSubmit} className="flex flex-col" style={{ gap }}>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#FFFFFF' }}>BIRTH DATE</label>
          <div className="relative">
            <input type="date" required value={dateValue} onChange={handleDateChange} max={`${new Date().getFullYear()}-12-31`} min="1900-01-01" placeholder="MM/DD/YYYY" data-empty={!dateValue ? "true" : undefined} className={`${INPUT_CLASS} date-no-icon`} />
          </div>
        </div>
        <div ref={wrapperRef} className="relative">
          <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#FFFFFF' }}>BIRTH LOCATION</label>
          <div className="relative">
            <input type="text" required value={cityQuery} onChange={(e) => { setCityQuery(e.target.value); setLocationError(false); setFormData((prev) => ({ ...prev, birthCity: "", lat: null, lng: null })); }} placeholder="City" className={`${INPUT_CLASS} ${locationError ? 'border-red-500' : ''}`} autoComplete="off" />
            {loadingSuggestions && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.place_id} onPointerDown={(e) => { e.preventDefault(); handleSelectCity(s); }} className="px-4 py-3 text-body text-foreground hover:bg-primary/10 cursor-pointer transition-colors">
                  {s.description}
                </li>
              ))}
            </ul>
          )}
          {locationError && !formData.lat && <p className="text-body text-red-400 mt-2">Please select a city from the dropdown</p>}
          {formData.lat && <p className="text-body text-muted-foreground mt-2">📍 {formData.birthCity}, {formData.birthCountry}</p>}
        </div>
      </div>
      <PrimaryButton type="submit" className="w-full mt-2">
        {submitLabel}
      </PrimaryButton>
    </form>
  );
}
