import { useState } from "react";

const BirthDataFormJsx = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    month: "",
    day: "",
    year: "",
    hour: "12",
    minute: "0",
    city: "",
    nation: "US",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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
      });
    }
  };

  const hasErrors = Object.keys(validate(formData)).length > 0;

  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
      errors[field] && touched[field] ? "border-destructive" : "border-border"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto">
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
      </div>

      {/* Time: Hour / Minute */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2 font-body uppercase tracking-wide">
          Birth Time <span className="text-muted-foreground/50">(24-hour format)</span>
        </label>
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
        <p className="text-muted-foreground/60 text-xs mt-2 font-body">
          If you don't know your exact birth time, use 12:00 noon
        </p>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2 font-body uppercase tracking-wide">
          Birth City
        </label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => handleChange("city", e.target.value)}
          onBlur={() => handleBlur("city")}
          placeholder="City name"
          className={inputClass("city")}
          maxLength={200}
        />
        {errors.city && touched.city && (
          <p className="text-destructive text-xs mt-1">{errors.city}</p>
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

      {/* Submit */}
      <button
        type="submit"
        disabled={hasErrors}
        className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-display text-lg tracking-wider uppercase hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-glow"
      >
        Generate My Birth Chart Artwork
      </button>
    </form>
  );
};

export default BirthDataFormJsx;
