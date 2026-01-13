"use client";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function JobDescriptionInput({
  value,
  onChange,
}: JobDescriptionInputProps) {
  return (
    <div>
      <label
        htmlFor="job-description"
        className="block text-sm font-medium text-slate-300 mb-3"
      >
        Job Description
      </label>
      <textarea
        id="job-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-gray-100 placeholder-slate-500 focus:ring-2 focus:ring-white/20 focus:border-slate-500 resize-y backdrop-blur-sm transition-all"
        placeholder="Paste the job description here..."
      />
      <p className="mt-2 text-xs sm:text-sm text-slate-400">
        {value.length} characters
      </p>
    </div>
  );
}

