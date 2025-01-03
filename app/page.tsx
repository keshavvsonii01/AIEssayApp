"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle, Send, BookOpen, Copy, Repeat } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface GeneratedContent {
  content: string;
  references: string[];
}

export default function Home() {
  const [keywords, setKeywords] = useState<string>("");
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const generationAbortController = useRef<AbortController | null>(null);

  // Typewriter effect function
  const typewriterEffect = useCallback((text: string) => {
    let currentIndex = 0;
    const typeNextCharacter = () => {
      if (currentIndex <= text.length) {
        // Prepend H3 tag to ensure default heading size
        const partialContent = `<h3>${text.slice(0, currentIndex)}</h3>`;
        setContent(partialContent);
        currentIndex++;

        // If not fully typed, schedule next character
        if (currentIndex <= text.length) {
          setTimeout(typeNextCharacter, 7);
        }
      }
    };

    // Start typing
    typeNextCharacter();
  }, []);

  // Persistent generation function
  const handleGenerate = async (regenerate = false) => {
    // Abort any ongoing generation
    if (generationAbortController.current) {
      generationAbortController.current.abort();
    }

    // Create new abort controller
    generationAbortController.current = new AbortController();

    if (regenerate && !keywords.trim()) {
      setError("Please enter keywords first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setContent(""); // Clear previous content

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        signal: generationAbortController.current.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keywords }),
      });

      if (!response.ok) {
        throw new Error("Content generation failed");
      }

      const data = await response.json();
      setGeneratedContent(data);

      // Start typewriter effect
      typewriterEffect(data.content);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quill modules for toolbar configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ font: [] }],
      ["clean"],
    ],
  };

  return (
    <div className="min-h-screen bg-[#151414] flex flex-col items-center justify-center p-4">

        <h1 className="text-6xl font-bold text-center text-[#e9e3e3] mb-20">
          {/* Academic Content Generator */}
          ACADEMIC ESSAY GENERATOR
        </h1>

      <div className="w-full max-w-3xl bg-[#DCD2D2] rounded-xl shadow-2xl p-14">
        <div className="mb-6 flex items-center justify-center">
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter research topic or keywords..."
            className="w-5/6 p-3 border-2 border-[#000] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c0c0c] text-black bg-[#f0ecec] mb-4"
          />
        </div>

        {error && (
          <div className="flex items-center bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            <AlertCircle className="mr-2" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex items-center justify-center">
        <button
          onClick={() => handleGenerate(false)}
          disabled={isLoading}
          className="w-1/2 bg-[#303030] text-[#DCD2D2] p-3 rounded-lg flex items-center justify-center hover:bg-[#060f19] transition duration-300 ease-in-out disabled:opacity-50"
        >
          {isLoading ? "Generating..." : "Generate Essay"}
          <Send className="ml-2" />
        </button>
        </div>

        {generatedContent && (
          <div className="mt-6 p-4 bg-[#FDF0F0] rounded-lg border-2 border-[#08121f]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black flex items-center">
                <BookOpen className="mr-2" /> Generated Content
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigator.clipboard.writeText(content)}
                  className="flex items-center bg-green-400 text-white px-3 py-2 rounded hover:bg-green-500 transition duration-300"
                >
                  <Copy className="mr-2" />
                  Copy Content
                </button>
                <button
                  onClick={() => handleGenerate(true)}
                  className="flex items-center bg-blue-400 text-white px-3 py-2 rounded hover:bg-blue-500 transition duration-300"
                >
                  <Repeat className="mr-2" />
                  Regenerate
                </button>
              </div>
            </div>

            <ReactQuill
              value={content}
              onChange={setContent}
              modules={modules}
              theme="snow"
              className="mb-4"
            />

            <div className="mt-4 border-t pt-4">
              <h3 className="text-lg font-semibold text-[#08121f] mb-2">
                References
              </h3>
              <ul className="list-disc list-inside text-gray-800">
                {generatedContent.references.map((ref, index) => (
                  <li key={index} className="mb-1">
                    {ref}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
