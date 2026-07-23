function InputField({ label, name, type = "text", value, onChange, required = false, autoComplete }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="field-input"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder=" "
      />
    </label>
  );
}

export default InputField;
