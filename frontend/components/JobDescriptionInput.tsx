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
      <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
        Job Description
      </label>
      <textarea
        id="job-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-y"
        placeholder="Paste the job description here..."
      />
      <p className="mt-2 text-sm text-gray-500">
        {value.length} characters
      </p>
    </div>
  );
}

