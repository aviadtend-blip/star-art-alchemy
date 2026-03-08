import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import PopularTag from "@/components/ui/PopularTag";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { DateWheelPicker } from "@/components/ui/date-wheel-picker";

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
  const [photoStatus, setPhotoStatus] = useState('');
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const fileInputRef = useRef(null);
  const faceApiLoadedRef = useRef(false);
  const faceApiLoadingRef = useRef(false);
  const pendingSubmitRef = useRef(null);

  // Lazy-load face-api.js from CDN
  const loadFaceApi = () => new Promise((resolve, reject) => {
    if (faceApiLoadedRef.current) return resolve();
    if (faceApiLoadingRef.current) {
      const interval = setInterval(() => {
        if (faceApiLoadedRef.current) { clearInterval(interval); resolve(); }
      }, 100);
      return;
    }
    faceApiLoadingRef.current = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
    script.onload = async () => {
      try {
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(
          'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
        );
        faceApiLoadedRef.current = true;
        resolve();
      } catch (e) { reject(e); }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // Preload face-api during Step 2 so it's warm by Step 3
  useEffect(() => {
    if (showTimeStep) {
      loadFaceApi().catch(() => {});
    }
  }, [showTimeStep]);

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

  // ── Photo handlers with face detection ──
  const handlePhotoSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) { setPhotoError('Photo must be under 10MB'); return; }

    setPhotoError(null);
    setPhotoUploading(true);
    setPhotoFile(file);
    setPhotoStatus('Detecting face...');
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);

    try {
      await loadFaceApi();

      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = objectUrl;
      });

      const detection = await window.faceapi.detectSingleFace(
        img,
        new window.faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })
      );

      if (!detection) {
        setPhotoError("We couldn't detect a face. Try a clearer, front-facing photo with good lighting.");
        setPhotoFile(null);
        setPhotoPreview(null);
        setPhotoUploading(false);
        setPhotoStatus('');
        return;
      }

      // Crop to face with 40% padding, clamped to image bounds, square crop
      const { x, y, width, height } = detection.box;
      const padX = width * 0.4;
      const padY = height * 0.4;
      const cropX = Math.max(0, x - padX);
      const cropY = Math.max(0, y - padY);
      const cropW = Math.min(img.width - cropX, width + padX * 2);
      const cropH = Math.min(img.height - cropY, height + padY * 2);
      const size = Math.min(cropW, cropH);

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, cropX, cropY, size, size, 0, 0, 512, 512);

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPhotoPreview(croppedDataUrl);

      setPhotoStatus('Uploading...');
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
      const path = `portraits/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { data, error } = await supabase.storage
        .from('user-photos')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

      if (error) throw error;
      const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(data.path);
      setUploadedPhotoUrl(urlData.publicUrl);
      setPhotoStatus('');
    } catch (err) {
      console.error('[BirthDataFormCard] Face crop/upload error:', err);
      setPhotoError('Upload failed. You can still generate without a photo.');
      setUploadedPhotoUrl(null);
      setPhotoStatus('');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadedPhotoUrl(null);
    setPhotoError(null);
    setPhotoStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitWithPhoto = () => {
    onSubmit({ ...pendingSubmitRef.current, userPhotoUrl: uploadedPhotoUrl });
  };

  const handleSubmitWithoutPhoto = () => {
    onSubmit({ ...pendingSubmitRef.current, userPhotoUrl: null });
  };

  const wheelDate = React.useMemo(() => {
    if (formData.birthYear && formData.birthMonth && formData.birthDay) {
      return new Date(Number(formData.birthYear), Number(formData.birthMonth) - 1, Number(formData.birthDay));
    }
    return new Date(1995, 5, 15); // sensible default
  }, [formData.birthYear, formData.birthMonth, formData.birthDay]);

  const handleWheelDateChange = useCallback((date) => {
    setFormData((prev) => ({
      ...prev,
      birthYear: String(date.getFullYear()),
      birthMonth: String(date.getMonth() + 1),
      birthDay: String(date.getDate()),
    }));
  }, [setFormData]);

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

        {/* Upload zone */}
        <div
          onClick={() => !photoUploading && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePhotoSelect(f); }}
          className="flex flex-col items-center justify-center cursor-pointer transition-colors"
          style={{
            border: '1px dashed rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: 32,
            minHeight: 160,
            backgroundColor: photoPreview ? 'transparent' : 'rgba(255,255,255,0.03)',
          }}
        >
          {photoUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-body text-foreground">{photoStatus}</p>
            </div>
          ) : photoPreview && uploadedPhotoUrl ? (
            <div className="flex flex-col items-center gap-3">
              <img src={photoPreview} alt="Your photo" className="w-20 h-20 rounded-full object-cover border border-white/20" />
              <p className="text-body text-foreground">Face detected ✓</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}
                className="text-body font-body"
                style={{ color: '#6A6A6A', textDecoration: 'underline' }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="text-body text-foreground">Click to upload or drag & drop</p>
              <p className="text-body" style={{ color: '#6A6A6A', fontSize: '13px' }}>JPG, PNG or WEBP · Max 10MB</p>
            </div>
          )}
        </div>

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
              className="h-12 px-6 rounded-full text-foreground text-a5 font-body transition hover:bg-white/10"
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
          <div className="hidden lg:block">
            <div className="flex items-end gap-4">
              <div className="flex-1 min-w-0">{timeInputsDesktop}</div>
              <PrimaryButton onClick={handleStep1bSubmit} className="flex-shrink-0">
                Continue
              </PrimaryButton>
            </div>
          </div>
          <div className="lg:hidden flex flex-col gap-6">
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
        <div className="hidden lg:flex items-start justify-between">
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
      <div>
        <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#FFFFFF' }}>BIRTH DATE</label>
        <DateWheelPicker
          value={wheelDate}
          onChange={handleWheelDateChange}
          minYear={1920}
          maxYear={new Date().getFullYear()}
          size="md"
        />
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
      <PrimaryButton type="submit" className="w-full mt-2">
        {submitLabel}
      </PrimaryButton>
    </form>
  );
}
