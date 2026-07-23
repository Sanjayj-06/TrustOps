/**
 * components/UploadSection.tsx
 * ----------------------------
 * Light theme — drag-and-drop file upload section.
 */

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CheckCircle } from "lucide-react";
const Upload = (props: any) => null;
const FileCode = (props: any) => null;
const TestTube = (props: any) => null;
const AlertCircle = (props: any) => null;
const Zap = (props: any) => null;
const Cpu = (props: any) => null;
const Layers = (props: any) => null;
const Lightbulb = (props: any) => null;

interface UploadSectionProps {
  onUpload: (buggyFile: File, testFile: File) => Promise<void>;
  isLoading: boolean;
}

interface FileState {
  file: File | null;
  error: string | null;
}

const SAMPLE_BUGGY_CODE = `# Sample buggy Python file
def calculate_average(numbers):
    """Calculate the average of a list of numbers."""
    total = 0
    for i in range(len(numbers) - 1):  # BUG: off-by-one, skips last element
        total = total + numbers[i]
    return total / len(numbers)

def find_max(arr):
    """Find the maximum value in an array."""
    if arr == None:  # BUG: should use 'is None'
        return None
    max_val = arr[0]
    for i in range(1, len(arr)):
        if arr[i] > max_val:
            max_val = arr[i]
    return max_val

def is_valid_age(age):
    """Check if age is in valid range 0-120."""
    if age < 0 and age > 120:  # BUG: should be 'or' not 'and'
        return False
    return True
`;

const SAMPLE_TEST_CODE = `# Sample test file
import pytest
from module_under_test import calculate_average, find_max, is_valid_age

def test_average_basic():
    assert calculate_average([1, 2, 3, 4, 5]) == 3.0

def test_average_single():
    assert calculate_average([10]) == 10.0

def test_find_max_normal():
    assert find_max([3, 1, 4, 1, 5, 9, 2, 6]) == 9

def test_find_max_none():
    assert find_max(None) is None

def test_valid_age_normal():
    assert is_valid_age(25) == True

def test_invalid_age_negative():
    assert is_valid_age(-1) == False

def test_invalid_age_over():
    assert is_valid_age(150) == False
`;

export default function UploadSection({
  onUpload,
  isLoading,
}: UploadSectionProps) {
  const [buggyFile, setBuggyFile] = useState<FileState>({
    file: null,
    error: null,
  });
  const [testFile, setTestFile] = useState<FileState>({
    file: null,
    error: null,
  });
  const [useSample, setUseSample] = useState(false);

  const onDropBuggy = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length > 0) {
      setBuggyFile({ file: null, error: "Only .py files are accepted" });
      return;
    }
    setBuggyFile({ file: accepted[0], error: null });
  }, []);

  const onDropTest = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length > 0) {
      setTestFile({ file: null, error: "Only .py files are accepted" });
      return;
    }
    setTestFile({ file: accepted[0], error: null });
  }, []);

  const {
    getRootProps: getBuggyProps,
    getInputProps: getBuggyInputProps,
    isDragActive: isBuggyDrag,
  } = useDropzone({
    onDrop: onDropBuggy,
    accept: { "text/x-python": [".py"] },
    multiple: false,
    disabled: isLoading || useSample,
  });

  const {
    getRootProps: getTestProps,
    getInputProps: getTestInputProps,
    isDragActive: isTestDrag,
  } = useDropzone({
    onDrop: onDropTest,
    accept: { "text/x-python": [".py"] },
    multiple: false,
    disabled: isLoading || useSample,
  });

  const handleSubmit = async () => {
    let bFile = buggyFile.file;
    let tFile = testFile.file;
    if (useSample) {
      bFile = new File([SAMPLE_BUGGY_CODE], "buggy_calculator.py", {
        type: "text/x-python",
      });
      tFile = new File([SAMPLE_TEST_CODE], "test_calculator.py", {
        type: "text/x-python",
      });
    }
    if (!bFile || !tFile) return;
    await onUpload(bFile, tFile);
  };

  const canSubmit =
    useSample || (buggyFile.file !== null && testFile.file !== null);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="section-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 tag-blue mb-3">
              <Zap className="w-3.5 h-3.5" />
              Upload Files
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              Start Your Evaluation
            </h2>
            <p className="text-slate-500 text-sm max-w-lg">
              Upload a buggy Python file and its unit tests. TrustPatch will
              generate 5 candidate patches and evaluate them across 10 trust
              dimensions.
            </p>
          </div>

          {/* Sample toggle - Bright & Classy */}
          <div className="flex-shrink-0 flex items-center justify-between w-full md:w-auto gap-4 bg-blue-100 border border-blue-300 rounded-xl px-4 py-3 shadow-sm transition-colors hover:bg-blue-200/50">
            <div className="flex flex-col">
              <p className="text-sm font-bold text-blue-900">
                Try a Sample Dataset
              </p>
              <p className="text-xs text-blue-700 mt-0.5 font-semibold">
                No files? Run a pre-built evaluation
              </p>
            </div>
            
            <button
              onClick={() => setUseSample(!useSample)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0 ml-2 shadow-sm ${
                useSample ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span className="sr-only">Use sample files</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                  useSample ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* File dropzones */}
        {!useSample && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Buggy File */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-red-400" />
                Buggy Python File <span className="text-red-400">*</span>
              </label>
              <div
                {...getBuggyProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isBuggyDrag
                    ? "border-blue-400 bg-blue-50"
                    : buggyFile.file
                      ? "border-emerald-300 bg-emerald-50"
                      : buggyFile.error
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <input {...getBuggyInputProps()} />
                {buggyFile.file ? (
                  <div className="space-y-1">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-emerald-700 font-semibold text-sm">
                      {buggyFile.file.name}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {(buggyFile.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : buggyFile.error ? (
                  <div className="space-y-1">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                    <p className="text-red-600 text-sm">{buggyFile.error}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-slate-600 font-medium text-sm">
                      Drop your buggy .py file here
                    </p>
                    <p className="text-slate-400 text-xs">or click to browse</p>
                  </div>
                )}
              </div>
            </div>

            {/* Test File */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <TestTube className="w-4 h-4 text-indigo-400" />
                Unit Test File <span className="text-red-400">*</span>
              </label>
              <div
                {...getTestProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isTestDrag
                    ? "border-indigo-400 bg-indigo-50"
                    : testFile.file
                      ? "border-emerald-300 bg-emerald-50"
                      : testFile.error
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
                }`}
              >
                <input {...getTestInputProps()} />
                {testFile.file ? (
                  <div className="space-y-1">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-emerald-700 font-semibold text-sm">
                      {testFile.file.name}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {(testFile.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : testFile.error ? (
                  <div className="space-y-1">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                    <p className="text-red-600 text-sm">{testFile.error}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-slate-600 font-medium text-sm">
                      Drop your test .py file here
                    </p>
                    <p className="text-slate-400 text-xs">
                      pytest-compatible tests
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sample preview */}
        {useSample && (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sample Files Preview
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  buggy_calculator.py
                </p>
                <pre className="code-block text-xs h-32 overflow-auto">
                  {SAMPLE_BUGGY_CODE.slice(0, 400)}...
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  test_calculator.py
                </p>
                <pre className="code-block text-xs h-32 overflow-auto">
                  {SAMPLE_TEST_CODE.slice(0, 400)}...
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-center mt-6">
          <button
            id="run-trustpatch-btn"
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="btn-primary text-base px-10 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Running Analysis...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run TrustPatch Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Cpu,
            title: "5 Candidate Patches",
            desc: "Auto-generated using rule-based transformations",
          },
          {
            icon: Layers,
            title: "10 Trust Parameters",
            desc: "Multi-dimensional quality evaluation",
          },
          {
            icon: Lightbulb,
            title: "AI Explainability",
            desc: "Human-readable reasoning for patch selection",
          },
        ].map((item) => (
          <div key={item.title} className="card p-4 flex items-start gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {item.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
