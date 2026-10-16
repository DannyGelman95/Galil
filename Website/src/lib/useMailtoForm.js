import { useState } from 'react';

// Static site, no backend — builds a mailto: link from the form's fields and
// hands the message to the visitor's own mail client (see README § Roadmap).
export function useMailtoForm({ to, subjectTemplate, fields, initialValues }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handleChange = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: false }));
    setSent(false);
  };

  const setValue = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
  };

  function checkField(check, value) {
    const val = (value || '').trim();
    if (check === 'required') return val.length > 1;
    if (check === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
    if (check === 'message') return val.length > 9;
    return true;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    fields.forEach((f) => {
      if (f.check && !checkField(f.check, values[f.name])) newErrors[f.name] = true;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    const subject = subjectTemplate.replace(/\{(\w+)\}/g, (_, k) => values[k] || '');
    const body = fields
      .filter((f) => f.type !== 'file')
      .map((f) => `${f.label}: ${values[f.name] || '—'}`)
      .join('\n');
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setSent(true);
    setValues(initialValues);
  };

  return { values, errors, sent, handleChange, setValue, handleSubmit };
}
