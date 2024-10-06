import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange }) => {
  return (
    <CodeMirror
      value={value}
      height="200px"
      extensions={[json()]}
      onChange={(value) => onChange(value)}
      theme="light"
      style={{ border: '1px solid #ccc', borderRadius: '4px' }}
    />
  );
};

export default JsonEditor;
