import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode,
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Code2,
  Maximize2,
  Minimize2,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from './ui/Button';

export default function LeetCodeEditor({
  code = '',
  onChange,
  targetLanguage = 'python',
  question = {},
  isPyodideReady = false,
  isRunningCode = false,
  onRunCode,
  codeExecutionResults = null,
  defaultStarterCode = '',
}) {
  const [copied, setCopied] = useState(false);
  const [copiedError, setCopiedError] = useState(false);
  const [editorHeight, setEditorHeight] = useState('380px');
  const [isExpanded, setIsExpanded] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcase'); // 'testcase' | 'result'
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const editorRef = useRef(null);

  const testCases = question?.test_cases || [];
  const hasTestCases = testCases.length > 0;

  // Map language name for Monaco
  const monacoLanguage = useMemo(() => {
    const l = (targetLanguage || 'python').toLowerCase();
    if (l === 'cpp' || l === 'c++') return 'cpp';
    if (l === 'js' || l === 'javascript' || l === 'node') return 'javascript';
    if (l === 'typescript' || l === 'ts') return 'typescript';
    return 'python';
  }, [targetLanguage]);

  const fileName = useMemo(() => {
    if (monacoLanguage === 'cpp') return 'solution.cpp';
    if (monacoLanguage === 'javascript' || monacoLanguage === 'typescript') return 'solution.js';
    return 'solution.py';
  }, [monacoLanguage]);

  const languageDisplayName = useMemo(() => {
    if (monacoLanguage === 'cpp') return 'C++ (g++ 10.2)';
    if (monacoLanguage === 'javascript') return 'JavaScript (Node.js)';
    if (monacoLanguage === 'typescript') return 'TypeScript';
    return 'Python 3 (3.10)';
  }, [monacoLanguage]);

  // When execution results arrive, automatically switch to the "result" tab
  useEffect(() => {
    if (codeExecutionResults) {
      setActiveConsoleTab('result');
      // If there are results, select the first failed case or first case
      if (codeExecutionResults.results && codeExecutionResults.results.length > 0) {
        const firstFailIdx = codeExecutionResults.results.findIndex(r => !r.passed);
        setActiveCaseIndex(firstFailIdx >= 0 ? firstFailIdx : 0);
      } else {
        setActiveCaseIndex(0);
      }
    }
  }, [codeExecutionResults]);

  // Copy code handler
  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Copy error handler
  const handleCopyError = async () => {
    if (!codeExecutionResults?.error) return;
    try {
      await navigator.clipboard.writeText(codeExecutionResults.error);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2000);
    } catch {
      // fallback
    }
  };

  // Reset to starter code handler
  const handleResetCode = () => {
    if (defaultStarterCode && onChange) {
      onChange(defaultStarterCode);
      if (editorRef.current) {
        editorRef.current.setValue(defaultStarterCode);
      }
    }
  };

  // Toggle expand height
  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
    setEditorHeight(prev => (prev === '380px' ? '540px' : '380px'));
  };

  // Monaco editor mount handler
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setEditorReady(true);

    // Register Ctrl+Enter / Cmd+Enter to run code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRunCode && !isRunningCode) {
        onRunCode();
      }
    });

    // Register Ctrl+' / Cmd+' (LeetCode standard shortcut)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Quote, () => {
      if (onRunCode && !isRunningCode) {
        onRunCode();
      }
    });
  };

  // Execution result analysis
  const hasError = Boolean(codeExecutionResults?.error);
  const allPassed = Boolean(codeExecutionResults?.all_passed || codeExecutionResults?.allPassed);
  const totalCases = codeExecutionResults?.total ?? testCases.length ?? 0;
  const passedCasesCount = codeExecutionResults?.results?.filter(r => r.passed)?.length ?? (allPassed ? totalCases : (codeExecutionResults?.passed ?? 0));

  return (
    <div className="space-y-3 font-sans">
      {/* 1. LeetCode-style Editor Shell */}
      <div className="rounded-xl border border-[#272730] bg-[#141418] overflow-hidden shadow-2xl transition-all">
        {/* Top IDE Toolbar */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#1A1A22] border-b border-[#272730] select-none flex-wrap gap-2">
          {/* Left: Language Indicator & File Tab */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#22222E] border border-[#333342] text-xs font-medium text-[#F4F4F5]">
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{languageDisplayName}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0F0F13] border border-[#2B2B38] text-xs font-mono font-semibold text-[#8B7CFF] shadow-xs">
              <FileCode className="w-3.5 h-3.5 text-[#8B7CFF]" />
              <span>{fileName}</span>
            </div>
          </div>

          {/* Right: Runtime Pill & Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Runtime status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111116] border border-[#272730] text-[11px] font-mono text-[#A1A1AA]">
              <span className={`w-2 h-2 rounded-full ${
                monacoLanguage === 'python'
                  ? isPyodideReady ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' : 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`} />
              <span className="hidden sm:inline">
                Server Sandbox
              </span>
            </div>

            {/* Reset button */}
            <button
              type="button"
              onClick={handleResetCode}
              title="Reset code to starter template"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#22222E] hover:bg-[#2B2B38] border border-[#333342] text-[11px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copy code to clipboard"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#22222E] hover:bg-[#2B2B38] border border-[#333342] text-[11px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>

            {/* Expand Height Toggle */}
            <button
              type="button"
              onClick={toggleExpand}
              title={isExpanded ? "Collapse editor height" : "Expand editor height"}
              className="p-1 rounded-md bg-[#22222E] hover:bg-[#2B2B38] border border-[#333342] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className="relative bg-[#1E1E1E]">
          <Editor
            height={editorHeight}
            language={monacoLanguage}
            value={code}
            onChange={(val) => onChange && onChange(val || '')}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            loading={
              <div className="h-[380px] w-full flex flex-col items-center justify-center bg-[#1E1E1E] text-[#71717A] text-xs gap-2">
                <Loader2 className="w-5 h-5 text-[#8B7CFF] animate-spin" />
                <span>Loading LeetCode Editor...</span>
              </div>
            }
            options={{
              selectOnLineNumbers: true,
              fontSize: 13,
              lineHeight: 21,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, Menlo, monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              lineNumbers: 'on',
              lineNumbersMinChars: 3,
              glyphMargin: false,
              renderLineHighlight: 'all',
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              folding: true,
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>

        {/* Editor Bottom Bar with LeetCode Run Action */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#17171E] border-t border-[#272730]">
          <div className="flex items-center gap-2 text-[11px] text-[#71717A] font-mono">
            <span className="hidden sm:inline">Shortcut:</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#22222C] border border-[#33333F] rounded text-[#A1A1AA] text-[10px]">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-[#22222C] border border-[#33333F] rounded text-[#A1A1AA] text-[10px]">Enter</kbd>
            </span>
          </div>

          <Button
            type="button"
            onClick={onRunCode}
            disabled={isRunningCode || !code || !hasTestCases}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#25252E] text-white font-mono font-bold text-xs flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition-all cursor-pointer"
          >
            {isRunningCode ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>
              {isRunningCode
                ? 'Running tests...'
                : hasTestCases
                ? `Run ${testCases.length} Test Cases`
                : 'No test cases yet'}
            </span>
          </Button>
        </div>
      </div>

      {/* 2. LeetCode Bottom Console Panel (Testcase & Test Result) */}
      <div className="rounded-xl border border-[#272730] bg-[#111116] overflow-hidden shadow-inner">
        {/* Console Header Tabs */}
        <div className="flex items-center justify-between px-3 bg-[#17171E] border-b border-[#272730]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveConsoleTab('testcase')}
              className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeConsoleTab === 'testcase'
                  ? 'border-emerald-400 text-emerald-400 bg-[#1D1D26]/50'
                  : 'border-transparent text-[#71717A] hover:text-[#D4D4D8]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Testcase</span>
              {hasTestCases && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#272732] text-[#A1A1AA]">
                  {testCases.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveConsoleTab('result')}
              className={`px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeConsoleTab === 'result'
                  ? 'border-cyan-400 text-cyan-400 bg-[#1D1D26]/50'
                  : 'border-transparent text-[#71717A] hover:text-[#D4D4D8]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Test Result</span>
              {codeExecutionResults && (
                <span className={`w-2 h-2 rounded-full ${
                  allPassed ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
                }`} />
              )}
            </button>
          </div>

          {/* Quick status pill on right */}
          {codeExecutionResults && (
            <div className="flex items-center gap-2 text-xs font-mono pr-2">
              {allPassed ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                </span>
              ) : hasError ? (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Runtime Error
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Wrong Answer
                </span>
              )}
              <span className="text-[#71717A]">
                ({passedCasesCount}/{totalCases} Passed)
              </span>
            </div>
          )}
        </div>

        {/* Tab 1: Testcase Panel (Inputs & Expected Outputs) */}
        {activeConsoleTab === 'testcase' && (
          <div className="p-4 space-y-3">
            {hasTestCases ? (
              <>
                {/* Case Selector Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {testCases.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveCaseIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        activeCaseIndex === idx
                          ? 'bg-[#2B2B38] text-white border border-[#444458] shadow-sm'
                          : 'bg-[#181820] text-[#71717A] hover:text-[#D4D4D8] hover:bg-[#20202A] border border-transparent'
                      }`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Selected Case Details */}
                {testCases[activeCaseIndex] && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider font-semibold">
                        Input
                      </span>
                      <div className="bg-[#0B0B0E] border border-[#22222A] p-3 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap min-h-[50px]">
                        {testCases[activeCaseIndex].input || 'None'}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider font-semibold">
                        Expected Output
                      </span>
                      <div className="bg-[#0B0B0E] border border-[#22222A] p-3 rounded-lg font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre-wrap min-h-[50px]">
                        {testCases[activeCaseIndex].expected_output || 'None'}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-xs text-[#71717A] font-mono">
                No test cases available yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Test Result Panel (LeetCode Style Execution Results) */}
        {activeConsoleTab === 'result' && (
          <div className="p-4 space-y-4">
            {!codeExecutionResults ? (
              <div className="text-center py-8 text-xs text-[#71717A] font-mono space-y-2">
                <Play className="w-5 h-5 mx-auto text-[#52525E]" />
                <p>Run your code to see execution outputs and test results here.</p>
              </div>
            ) : (
              <>
                {/* Result Status Banner */}
                <div className={`p-4 rounded-xl border font-mono text-xs space-y-2 ${
                  allPassed
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center justify-between font-bold text-sm">
                    <div className="flex items-center gap-2">
                      {allPassed ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400">Accepted</span>
                        </>
                      ) : hasError ? (
                        <>
                          <AlertCircle className="w-5 h-5 text-rose-400" />
                          <span className="text-rose-400">Runtime Error</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400" />
                          <span className="text-rose-400">Wrong Answer</span>
                        </>
                      )}
                    </div>

                    <div className="text-xs font-mono font-medium">
                      <span>{passedCasesCount}</span> / <span>{totalCases}</span> Test Cases Passed
                    </div>
                  </div>
                </div>

                {/* Prominent LeetCode-style Error Console if execution failed with traceback */}
                {hasError && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-400">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-rose-400" />
                        <span>Error Output / Traceback</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyError}
                        className="flex items-center gap-1 text-[11px] font-mono text-[#A1A1AA] hover:text-[#F4F4F5] bg-[#1E1E26] hover:bg-[#272732] px-2 py-0.5 rounded border border-[#333342] transition-colors cursor-pointer"
                      >
                        {copiedError ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Traceback</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <pre className="bg-[#0B0B0E] border border-rose-900/60 p-4 rounded-xl font-mono text-xs text-rose-300 whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-inner max-h-[300px] select-text">
                        {codeExecutionResults.error}
                      </pre>
                    </div>

                    <div className="flex items-start gap-1.5 text-[11px] text-[#A1A1AA] font-mono bg-[#16161D] p-2.5 rounded-lg border border-[#272732]">
                      <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        An exception occurred during code execution. Review the traceback above to see the failing file, line, and exception message.
                      </span>
                    </div>
                  </div>
                )}

                {/* Individual Test Cases Results (if any were evaluated) */}
                {codeExecutionResults.results && codeExecutionResults.results.length > 0 && (
                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-mono font-bold text-[#A1A1AA]">
                      Test Cases Evaluation:
                    </div>

                    {/* Case Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {codeExecutionResults.results.map((r, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveCaseIndex(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            activeCaseIndex === idx
                              ? 'bg-[#2B2B38] text-white border border-[#444458] shadow-sm'
                              : 'bg-[#181820] text-[#71717A] hover:text-[#D4D4D8] border border-transparent'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            r.passed ? 'bg-emerald-400' : 'bg-rose-400'
                          }`} />
                          <span>Case {r.case || r.test_case || (idx + 1)}</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Result Detail */}
                    {codeExecutionResults.results[activeCaseIndex] && (
                      <div className="bg-[#0B0B0E] border border-[#22222A] p-3.5 rounded-xl space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-[#202028]">
                          <span className="text-[#71717A] font-semibold">
                            Case {activeCaseIndex + 1} Status:
                          </span>
                          <span className={`font-bold uppercase text-[11px] px-2 py-0.5 rounded ${
                            codeExecutionResults.results[activeCaseIndex].passed
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          }`}>
                            {codeExecutionResults.results[activeCaseIndex].passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-[#71717A] uppercase tracking-wider">Input</span>
                          <div className="bg-[#14141A] p-2.5 rounded-lg text-emerald-400 overflow-x-auto">
                            {codeExecutionResults.results[activeCaseIndex].input || 'None'}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#71717A] uppercase tracking-wider">Output</span>
                            <div className={`p-2.5 rounded-lg overflow-x-auto ${
                              codeExecutionResults.results[activeCaseIndex].passed
                                ? 'bg-[#14141A] text-emerald-400'
                                : 'bg-[#1C141A] text-rose-400'
                            }`}>
                              {String(codeExecutionResults.results[activeCaseIndex].actual ?? 'None')}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-[#71717A] uppercase tracking-wider">Expected</span>
                            <div className="bg-[#14141A] p-2.5 rounded-lg text-cyan-300 overflow-x-auto">
                              {String(codeExecutionResults.results[activeCaseIndex].expected ?? 'None')}
                            </div>
                          </div>
                        </div>

                        {codeExecutionResults.results[activeCaseIndex].error && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] text-rose-400 uppercase tracking-wider">Case Error</span>
                            <div className="bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-lg text-rose-300 overflow-x-auto">
                              {codeExecutionResults.results[activeCaseIndex].error}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
