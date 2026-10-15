// src/hooks/usePyodide.js
import { useState, useEffect, useRef } from "react";

export function usePyodide() {
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const workerRef = useRef(null);

  useEffect(() => {
    // Web Worker load karein
    const worker = new Worker("/pyodide.worker.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, message } = e.data;
      if (type === "STATUS") {
        setStatusMessage(message);
      } else if (type === "READY") {
        setIsReady(true);
        setStatusMessage("Ready");
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const runCode = (userCode, functionName, testCases) => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isReady) {
        resolve({ success: false, error: "Pyodide not ready yet" });
        return;
      }

      setIsRunning(true);

      const handleResponse = (e) => {
        const data = e.data;
        if (data.type === "EXECUTION_COMPLETE" || data.type === "EXECUTION_ERROR") {
          setIsRunning(false);
          workerRef.current.removeEventListener("message", handleResponse);
          resolve(data);
        }
      };

      workerRef.current.addEventListener("message", handleResponse);
      workerRef.current.postMessage({ userCode, functionName, testCases });
    });
  };

  return { isReady, isRunning, statusMessage, runCode };
}
