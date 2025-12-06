import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, Download, RefreshCw, Eraser, Image as ImageIcon, Save, Undo, Redo, MousePointer2 } from 'lucide-react';
import AirCanvas, { AirCanvasHandle } from './components/AirCanvas';
import VoiceInput from './components/VoiceInput';
import { ArtStyle } from './types';
import { STYLE_ICONS } from './constants';
import { generateImageFromSketch } from './services/geminiService';

function App() {
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>(ArtStyle.ILLUSTRATION);
  const [error, setError] = useState<string | null>(null);

  const airCanvasRef = useRef<AirCanvasHandle>(null);

  // Callback to update canvas data from the AirCanvas component
  const handleCanvasUpdate = useCallback((dataUrl: string) => {
    setCanvasDataUrl(dataUrl);
  }, []);

  const handleGenerate = async () => {
    if (!canvasDataUrl) {
        setError("Canvas is empty!");
        setTimeout(() => setError(null), 3000);
        return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null); 

    try {
      const result = await generateImageFromSketch(canvasDataUrl, prompt, selectedStyle);
      setGeneratedImage(result);
      
      // Auto-clear sketch on success for a fresh start
      if (airCanvasRef.current) {
        airCanvasRef.current.clearCanvas();
      }

    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `sketchair-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClear = () => {
      setGeneratedImage(null);
      if (airCanvasRef.current) {
          airCanvasRef.current.clearCanvas();
      }
  };

  return (
    <div className="h-screen flex flex-col bg-[#dfe8f5]">
      
      {/* 1. Title Bar (Quick Access Toolbar style) */}
      <div className="bg-white border-b border-gray-300 flex items-center px-2 py-1 gap-2 text-xs select-none">
         <div className="flex gap-2 border-r border-gray-300 pr-2">
            <Save className="w-4 h-4 text-purple-700" />
            <Undo className="w-4 h-4 text-gray-400" />
            <Redo className="w-4 h-4 text-gray-400" />
         </div>
         <div className="flex-1 text-center font-normal text-gray-700">
            Untitled - SketchAir Paint
         </div>
      </div>

      {/* 2. The Ribbon UI */}
      <div className="bg-[#f5f6f7] border-b border-gray-300 px-1 py-1 flex gap-1 h-32 select-none shadow-sm z-20">
         
         {/* Group: Image */}
         <div className="flex flex-col border-r border-gray-300 px-2 min-w-[80px]">
            <div className="flex-1 flex flex-col items-center justify-center gap-1 group cursor-pointer" onClick={handleDownload} title="Download Result">
                <div className={`p-2 rounded hover:bg-[#cce8ff] hover:border hover:border-[#99d1ff] ${!generatedImage ? 'opacity-50 grayscale' : ''}`}>
                    <Download className="w-8 h-8 text-blue-600" />
                </div>
                <span className="text-[11px] text-gray-600 group-hover:text-black">Save</span>
            </div>
            <div className="text-center text-[11px] text-gray-500 mt-1">Image</div>
         </div>

         {/* Group: Tools */}
         <div className="flex flex-col border-r border-gray-300 px-3 min-w-[240px]">
            <div className="flex-1 flex flex-col gap-2 pt-1">
                 {/* Input Area */}
                 <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe object..."
                            className="w-full h-8 border border-gray-300 px-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-300 shadow-inner bg-white"
                        />
                    </div>
                    <VoiceInput onTranscript={(text) => setPrompt((prev) => prev ? `${prev} ${text}` : text)} isProcessing={isGenerating} />
                 </div>
                 {/* Clear Button */}
                 <button onClick={handleClear} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-[#cce8ff] border border-transparent hover:border-[#99d1ff] rounded self-start">
                    <Eraser className="w-4 h-4 text-red-500" />
                    <span>Clear Canvas</span>
                 </button>
            </div>
            <div className="text-center text-[11px] text-gray-500 mt-1">Tools</div>
         </div>

         {/* Group: Styles (Brushes/Shapes) */}
         <div className="flex flex-col border-r border-gray-300 px-2 flex-1 max-w-md">
            <div className="flex-1 grid grid-cols-3 gap-1 content-center py-1">
                {Object.values(ArtStyle).map((style) => {
                    const Icon = STYLE_ICONS[style];
                    const isSelected = selectedStyle === style;
                    return (
                        <button
                            key={style}
                            onClick={() => setSelectedStyle(style)}
                            className={`flex flex-col items-center justify-center p-1 border rounded text-[10px] leading-tight transition-all ${
                                isSelected 
                                ? 'bg-[#ffeb9c] border-[#ffb800] shadow-[inset_0_0_2px_rgba(255,184,0,0.5)]' 
                                : 'border-transparent hover:bg-[#cce8ff] hover:border-[#99d1ff]'
                            }`}
                        >
                            <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-black' : 'text-gray-600'}`} />
                            <span className="truncate w-full text-center">{style}</span>
                        </button>
                    );
                })}
            </div>
            <div className="text-center text-[11px] text-gray-500 mt-1">Styles</div>
         </div>

         {/* Group: Generate (Magic) */}
         <div className="flex flex-col px-4 min-w-[120px]">
             <div className="flex-1 flex items-center justify-center">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`flex flex-col items-center justify-center p-2 rounded w-full h-full border transition-all ${
                        isGenerating
                        ? 'bg-gray-100 text-gray-400 border-gray-300'
                        : 'bg-gradient-to-b from-purple-50 to-purple-100 border-purple-300 hover:bg-purple-200 active:bg-purple-300'
                    }`}
                >
                    {isGenerating ? (
                        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
                    ) : (
                        <Sparkles className="w-8 h-8 text-purple-600 drop-shadow-sm" />
                    )}
                    <span className="text-xs font-bold text-purple-900 mt-1">Transform</span>
                </button>
             </div>
             <div className="text-center text-[11px] text-gray-500 mt-1">Magic</div>
         </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-[#e0e4eb] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
         
         {/* The "Paper" Container */}
         <div className="relative bg-white shadow-xl border border-gray-400 w-full max-w-4xl aspect-video">
            
            {/* Error Message Bar */}
            {error && (
                <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 text-xs px-2 py-1 border-b border-red-300 z-50 text-center">
                    {error}
                </div>
            )}

            {/* Generated Image Overlay (Result) */}
            {generatedImage ? (
                <div className="absolute inset-0 z-30 bg-white animate-in fade-in duration-300">
                    <img src={generatedImage} alt="Result" className="w-full h-full object-contain" />
                    <button 
                        onClick={() => setGeneratedImage(null)}
                        className="absolute top-2 right-2 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 border border-gray-300 rounded px-2 py-1 text-xs shadow-sm"
                    >
                        Close Preview (X)
                    </button>
                    <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                        Result: {selectedStyle}
                    </div>
                </div>
            ) : null}

            {/* The Actual Air Canvas */}
            <AirCanvas 
              ref={airCanvasRef}
              onCanvasUpdate={handleCanvasUpdate} 
              isDrawingMode={true} 
            />

            {/* "Resize Handles" (Visual only) */}
            <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-white border border-gray-500 cursor-nwse-resize z-40"></div>
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white border border-gray-500 cursor-ew-resize z-40"></div>
            <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-white border border-gray-500 cursor-ns-resize z-40"></div>
         </div>
      </div>

      {/* 4. Status Bar */}
      <div className="bg-[#f0f0f0] border-t border-gray-300 px-2 py-1 text-[11px] flex items-center justify-between text-gray-600 select-none">
          <div className="flex gap-4">
              <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3"/> Canvas: 800 x 600px</span>
              <span className="border-l border-gray-300 pl-4">Powered by Gemini 2.5</span>
          </div>
          <div>
              Zoom: 100%
          </div>
      </div>

    </div>
  );
}

export default App;