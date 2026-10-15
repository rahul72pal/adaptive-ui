// src/components/CodingWorkspace.jsx
import React, { useState } from "react";
import { usePyodide } from "../hooks/usePyodide";
import { learningApi } from "../api/learningApi";

export default function CodingWorkspace({ question = {} }) {
  const { isReady, isRunning, statusMessage, runCode } = usePyodide();

  // Starter code jo backend question engine deta hai
  const starterCode = question.function_signature 
    ? `${question.function_signature}\n    # Write your solution here\n    pass`
    : `def solution(arr):\n    # Write your solution here\n    pass`;

  const [code, setCode] = useState(starterCode);
  const [testResults, setTestResults] = useState(null);

  // Function name extract karein (e.g. 'find_max' from 'def find_max(nums):')
  const extractFnName = (sig) => {
    if (!sig) return "solution";
    return sig.replace("def ", "").split("(")[0].trim();
  };

  const handleRun = async () => {
    const fnName = extractFnName(question.function_signature);
    // Question ke sample test cases run honge
    const res = await runCode(code, fnName, question.sample_test_cases || []);
    setTestResults(res);

    // Agar saare pass ho gaye toh backend ko mastery update notify karein
    if (res && res.allPassed) {
      console.log("Passed! Send mastery signal to backend API");
      if (question.user_id && question.topic && question.concept_id) {
        try {
          await learningApi.verifyPractice({
            user_id: question.user_id,
            topic: question.topic,
            concept_id: question.concept_id,
            passed: true
          });
        } catch (err) {
          console.error("Failed to notify backend of mastery update:", err);
        }
      }
    }
  };

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      {/* Left: Problem statement */}
      <div style={{ flex: 1 }}>
        <h3>{question.question || "Python Coding Task"}</h3>
        <p><strong>Status:</strong> {statusMessage}</p>
        
        <h4>Sample Test Cases:</h4>
        <pre style={{ background: "#f4f4f4", padding: "10px", borderRadius: "4px" }}>
          {JSON.stringify(question.sample_test_cases || [], null, 2)}
        </pre>
      </div>

      {/* Right: Code Editor & Execution */}
      <div style={{ flex: 1.2 }}>
        <textarea
          rows={12}
          style={{ width: "100%", fontFamily: "monospace", padding: "10px" }}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <br />
        <button 
          onClick={handleRun} 
          disabled={!isReady || isRunning}
          style={{ padding: "8px 16px", marginTop: "10px", cursor: "pointer" }}
        >
          {isRunning ? "Running in Browser..." : "Run Test Cases"}
        </button>

        {/* Results output */}
        {testResults && (
          <div style={{ marginTop: "15px" }}>
            <h4>Result: {testResults.allPassed ? "✅ All Tests Passed!" : "❌ Some Tests Failed"}</h4>
            {testResults.results?.map((t) => (
              <div key={t.test_case} style={{ color: t.passed ? "green" : "red", marginBottom: "4px" }}>
                Case {t.test_case}: {t.passed ? "PASSED" : `FAILED (Expected: ${t.expected}, Got: ${t.actual || t.error})`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
