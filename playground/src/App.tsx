import Editor, { useMonaco } from "@monaco-editor/react";
import { MarkerSeverity } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useState, useCallback } from "react";

import init, { Check, check } from "./pkg/ruff.js";
import { AVAILABLE_OPTIONS, OptionGroup } from "./options";

type Config = { [key: string]: { [key: string]: string } };

function getDefaultConfig(availableOptions: OptionGroup[]): Config {
  const config: Config = {};
  availableOptions.forEach((group) => {
    if (!config[group.name]) config[group.name] = {};

    group.fields.forEach((f) => {
      config[group.name][f.name] = f.default;
    });
  });
  return config;
}

function toRuffConfig(config: Config): any {
  const convertValue = (value: string): any => {
    return value === "None" ? null : JSON.parse(value);
  };

  let result: any = {};
  try {
    Object.keys(config).forEach((group_name) => {
      let fields = config[group_name];
      if (group_name === "globals") {
        Object.keys(fields).forEach((field_name) => {
          result[field_name] = convertValue(fields[field_name]);
        });
      } else {
        if (!result[group_name]) result[group_name] = {};
        Object.keys(fields).forEach((field_name) => {
          result[group_name][field_name] = convertValue(fields[field_name]);
        });
      }
    });
  } catch (e) {
    console.error(e);
    return;
  }

  return result;
}

function Options({
  onConfigChange,
}: {
  onConfigChange: (config: Config) => void;
}) {
  const [config, setConfig] = useState(getDefaultConfig(AVAILABLE_OPTIONS));

  useEffect(() => onConfigChange(config), [config]);

  return (
    <div id="options">
      {AVAILABLE_OPTIONS.map((group) => (
        <details open={group.name === "globals"}>
          <summary>{group.name}</summary>
          <div>
            <ul>
              {group.fields.map((field) => (
                <li>
                  <span>
                    <label>
                      {field.name}
                      <input
                        value={config[group.name][field.name]}
                        type="text"
                        onChange={(event) => {
                          setConfig({
                            ...config,
                            [group.name]: {
                              ...config[group.name],
                              [field.name]: event.target.value,
                            },
                          });
                        }}
                      />
                    </label>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ))}
    </div>
  );
}

function App() {
  const [initialized, setInitialized] = useState<boolean>(false);
  const monaco = useMonaco();
  const [config, setConfig] = useState({});
  const [source, setSource] = useState("if (1, 2): pass");
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    init().then(() => setInitialized(true));
  }, []);

  useEffect(() => {
    let editor = monaco?.editor;
    let model = editor?.getModels()[0];
    if (!editor || !model || !initialized || !source) {
      return;
    }

    let checks: Check[];
    try {
      checks = check(source, toRuffConfig(config));
      setError(null);
    } catch (e) {
      setError(String(e));
      return;
    }

    editor.setModelMarkers(
      model,
      "owner",
      checks.map((check) => ({
        startLineNumber: check.location.row,
        startColumn: check.location.column,
        endLineNumber: check.location.row,
        endColumn: check.location.column,
        message: `${check.code}: ${check.message}`,
        severity: MarkerSeverity.Error,
      }))
    );
  }, [config, source, monaco]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      value && setSource(value);
    },
    [setSource]
  );

  return (
    <div id="app">
      <Options onConfigChange={setConfig} />
      <Editor
        options={{ readOnly: false, minimap: { enabled: false } }}
        defaultLanguage="python"
        defaultValue="if (1, 2): pass"
        theme={"light"}
        onChange={handleEditorChange}
      />
      {error && <div id="error">{error}</div>}
    </div>
  );
}

export default App;
