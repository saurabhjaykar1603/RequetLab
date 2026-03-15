import { useState, useRef, useEffect } from 'react';

const EditableText = ({ text, onSave, className = "", style = {} }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(text);
  }, [text]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    // Focus after render
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  };

  const handleBlur = () => {
    if (isEditing) {
      setIsEditing(false);
      if (value !== text) {
        onSave(value);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      inputRef.current.blur();
    } else if (e.key === 'Escape') {
      setValue(text);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        className={`inline-edit-input ${className}`}
        style={{
          width: '100%',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent-color)',
          color: 'var(--text-main)',
          padding: '2px 4px',
          borderRadius: '4px',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          outline: 'none',
          ...style
        }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span 
      onDoubleClick={handleDoubleClick} 
      className={className}
      style={{ cursor: 'pointer', display: 'inline-block', width: '100%', ...style }}
      title="Double click to edit"
    >
      {text}
    </span>
  );
};

export default EditableText;
