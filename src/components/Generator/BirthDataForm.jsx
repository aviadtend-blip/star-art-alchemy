import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const BirthDataFormJsx = ({ onSubmit }) => {
  const isMobile = useIsMobile();
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
        // Clear city error
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

  const validate = (data) => {
    const errs = {};
    const month = Number(data.month);
    const day = Number(data.day);
    const year = Number(data.year);
    const hour = Number(data.hour);
    const minute = Number(data.minute);

    if (!data.month || month < 1 || month > 12) errs.month = "1–12";
    if (!data.day || day < 1 || day > 31) errs.day = "1–31";
    if (!data.year || year < 1900 || year > 2025) errs.year = "1900–2025";
    if (data.hour === "" || hour < 0 || hour > 23) errs.hour = "0–23";
    if (data.minute === "" || minute < 0 || minute > 59) errs.minute = "0–59";
    if (!data.city.trim()) errs.city = "Required";

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

  const handleSubmit = (e) => {
    e.preventDefault();
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
      });
    }
  };

  const hasErrors = Object.keys(validate(formData)).length > 0;

  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
      errors[field] && touched[field] ? "border-destructive" : "border-border"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto" style={{ maxWidth: '28rem' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl text-foreground tracking-wide mb-2">
          Enter Your Birth Information
        </h2>
        <p className="text-muted-foreground text-sm font-body">
          We'll use this to create your personalized birth chart artwork
        </p>
      </div>

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
              max="2025-12-31"
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
              { field: "year", placeholder: "YYYY", min: 1900, max: 2025 },
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
            // Clear resolved location when user edits
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

      {/* Country — auto-filled from Places but still editable */}
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

      {/* Submit */}
      <button
        type="submit"
        disabled={hasErrors}
        className="btn-base btn-primary w-full"
      >
        Generate My Birth Chart Artwork
      </button>
    </form>
  );
};

export default BirthDataFormJsx;
