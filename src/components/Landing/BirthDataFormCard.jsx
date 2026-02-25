import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import PrimaryButton from "@/components/ui/PrimaryButton";

const INPUT_CLASS = "w-full bg-transparent border-0 border-b border-white/20 rounded-none px-0 py-3 text-lg text-left text-foreground placeholder:text-[#B1B1B1] focus:border-primary focus:ring-0 transition outline-none";

/**
 * Shared birth data form card used in both hero sections and the bottom-of-page form.
 * Handles Step 1a (date + location) and Step 1b (time) inline.
 *
 * Props:
 *  - formData, setFormData — shared form state from parent
 *  - onSubmit(params) — called with final { name, month, day, year, hour, minute, city, nation, lat, lng }
 *  - submitLabel — label for Step 1a submit button (default: "Continue")
 *  - gap — CSS gap value (default: 24)
 */
export default function BirthDataFormCard({
  formData,
  setFormData,
  onSubmit,
  submitLabel = "Continue",
  gap = 24,
}) {
  const [showTimeStep, setShowTimeStep] = useState(false);
  const [birthTimeValue, setBirthTimeValue] = useState("12:00");
  const [dontKnowTime, setDontKnowTime] = useState(false);
  const [locationError, setLocationError] = useState(false);

  // City autocomplete
  const [cityQuery, setCityQuery] = useState(formData.birthCity || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Sync cityQuery if formData.birthCity changes externally (e.g. test fill)
  useEffect(() => {
    if (formData.birthCity && formData.birthCity !== cityQuery) {
      setCityQuery(formData.birthCity);
    }
  }, [formData.birthCity]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
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
    setCityQuery(prediction.description);
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places-detail", { body: { place_id: prediction.place_id } });
      if (!error && data) {
        setFormData((prev) => ({ ...prev, birthCity: data.city || prediction.description, birthCountry: data.nation || prev.birthCountry, lat: data.lat, lng: data.lng }));
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
      const [h, m] = birthTimeValue.split(":");
      hour = Number(h);
      minute = Number(m);
    }
    onSubmit({
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
    });
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

  if (showTimeStep) {
    return (
      <div className="flex flex-col" style={{ gap }}>
        <div>
          <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#FFFFFF' }}>BIRTH TIME</label>
          <div className={`transition-opacity ${dontKnowTime ? 'opacity-20 pointer-events-none' : ''}`}>
            <input
              type="time"
              value={birthTimeValue}
              onChange={(e) => setBirthTimeValue(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div className="flex items-start gap-3 min-h-[52px]">
          <div
            className="w-5 h-5 mt-0.5 rounded flex items-center justify-center flex-shrink-0 cursor-pointer border border-white/10"
            style={{ backgroundColor: '#2C2C2C' }}
            onClick={() => setDontKnowTime(!dontKnowTime)}
          >
            {dontKnowTime && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
        <div className="flex items-center gap-[30px]">
          <button type="button" onClick={() => setShowTimeStep(false)} className="link-a5 font-body text-foreground py-4">
            Back
          </button>
          <PrimaryButton onClick={handleStep1bSubmit} className="flex-1">
            Choose style
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleStep1aSubmit} className="flex flex-col" style={{ gap }}>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#FFFFFF' }}>BIRTH DATE</label>
          <input
            type="date"
            required
            value={dateValue}
            onChange={handleDateChange}
            max="2026-12-31"
            min="1900-01-01"
            className={`${INPUT_CLASS} date-no-icon`}
          />
        </div>
        <div ref={wrapperRef} className="relative">
          <label className="block text-subtitle tracking-[3px] mb-4" style={{ color: '#FFFFFF' }}>BIRTH LOCATION</label>
          <div className="relative">
            <input
              type="text"
              required
              value={cityQuery}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setLocationError(false);
                setFormData((prev) => ({ ...prev, birthCity: "", lat: null, lng: null }));
              }}
              placeholder="City"
              className={`${INPUT_CLASS} ${locationError ? 'border-red-500' : ''}`}
              autoComplete="off"
            />
            {loadingSuggestions && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.place_id} onClick={() => handleSelectCity(s)} className="px-4 py-3 text-body text-foreground hover:bg-primary/10 cursor-pointer transition-colors">
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
