// public/pyodide.worker.js
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");

let pyodide = null;
let pyodideLoadingPromise = null;

async function initPyodide() {
  if (!pyodideLoadingPromise) {
    pyodideLoadingPromise = (async () => {
      self.postMessage({ type: "STATUS", message: "Loading Python runtime..." });
      pyodide = await loadPyodide();
      self.postMessage({ type: "READY", message: "Python runtime ready!" });
      return pyodide;
    })();
  }
  return pyodideLoadingPromise;
}

initPyodide();

self.onmessage = async (event) => {
  const { userCode, functionName, testCases } = event.data;

  try {
    const py = await initPyodide();

    // Set variables safely in Pyodide global namespace
    py.globals.set("__user_code__", userCode);
    py.globals.set("__test_cases_json__", JSON.stringify(testCases || []));
    py.globals.set("__target_fn_name__", functionName || "solution");

    const testRunnerScript = `
import json
import sys

# 1. Execute user code in global space
exec(__user_code__, globals())

raw_test_cases = json.loads(__test_cases_json__)
results = []
fn_name = __target_fn_name__

fn = globals().get(fn_name)
if not fn:
    # Fallback search for any user-defined function if name differs
    all_funcs = [v for k, v in globals().items() if callable(v) and not k.startswith("__") and k != "json"]
    fn = all_funcs[-1] if all_funcs else None

if not fn:
    raise Exception(f"Function '{fn_name}' not found. Please check your function signature.")

for idx, tc in enumerate(raw_test_cases):
    raw_in = tc.get("input", "")
    expected_raw = tc.get("expected_output", "")
    
    try:
        parsed_in = json.loads(raw_in) if isinstance(raw_in, str) and raw_in.strip() != "" else raw_in
    except Exception:
        parsed_in = raw_in

    try:
        if parsed_in is None:
            actual = fn()
        elif isinstance(parsed_in, list):
            actual = fn(parsed_in)
        elif isinstance(parsed_in, dict):
            actual = fn(**parsed_in)
        else:
            actual = fn(parsed_in)

        try:
            expected = json.loads(expected_raw) if isinstance(expected_raw, str) and expected_raw not in ["None", "null"] else expected_raw
        except Exception:
            expected = expected_raw

        passed = (actual == expected) or (str(actual).strip() == str(expected_raw).strip())
        results.append({
            "test_case": idx + 1,
            "passed": bool(passed),
            "input": str(raw_in),
            "expected": str(expected_raw),
            "actual": str(actual),
            "error": None
        })
    except Exception as e:
        results.append({
            "test_case": idx + 1,
            "passed": False,
            "input": str(raw_in),
            "expected": str(expected_raw),
            "actual": None,
            "error": str(e)
        })

json.dumps(results)
`;

    const resultsJson = await py.runPythonAsync(testRunnerScript);
    const parsedResults = JSON.parse(resultsJson);
    const allPassed = parsedResults.length > 0 && parsedResults.every((t) => t.passed);

    self.postMessage({
      type: "EXECUTION_COMPLETE",
      success: true,
      allPassed: allPassed,
      results: parsedResults
    });

  } catch (error) {
    self.postMessage({
      type: "EXECUTION_ERROR",
      success: false,
      allPassed: false,
      error: error.message
    });
  }
};
