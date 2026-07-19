function InputField({ label, name, type = "text", value, onChange, required = false, autoComplete }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="field-input"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
      />
    </label>
  );
}

export default InputField;
