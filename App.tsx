
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, Eraser, Image as ImageIcon, Save, Undo, Redo, MousePointer2, Palette, X, Trash2 } from 'lucide-react';
import AirCanvas, { AirCanvasHandle } from './components/AirCanvas';
import VoiceInput, { VoiceInputHandle } from './components/VoiceInput';
import { ArtStyle, GalleryItem } from './types';
import { STYLE_ICONS } from './constants';
import { generateImageFromSketch } from './services/geminiService';

const PRESET_COLORS = [
    '#000000', // Black
    '#EF4444', // Red
    '#F59E0B', // Orange
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#888888', // Gray
];

function App() {
  const [canvasDataUrl, setCanvasDataUrl] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  // New state to store the prompt used for the *current* result, separate from input
  const [resultPrompt, setResultPrompt] = useState(""); 
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>(ArtStyle.ILLUSTRATION);
  const [error, setError] = useState<string | null>(null);
  
  // Gallery State
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [showGallery, setShowGallery] = useState(true);

  // New States for Drawing Tools
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(4);

  const airCanvasRef = useRef<AirCanvasHandle>(null);
  const voiceInputRef = useRef<VoiceInputHandle>(null);

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
      // Save the current prompt to resultPrompt before clearing
      setResultPrompt(prompt);
      
      const result = await generateImageFromSketch(canvasDataUrl, prompt, selectedStyle);
      setGeneratedImage(result);
      
      // Clear the input prompt so user can start fresh immediately
      setPrompt("");

      // We do NOT clear the sketch automatically anymore, allowing style switching.
      // But we can inform the user via toast/console if needed.

    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string) => {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `sketch-air-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleClear = () => {
      setGeneratedImage(null);
      if (airCanvasRef.current) {
          airCanvasRef.current.clearCanvas();
      }
  };

  const handleUndo = () => {
      if (airCanvasRef.current) {
          airCanvasRef.current.undo();
      }
  };

  // Triggers from Gestures
  const handleVoiceTrigger = useCallback(() => {
      if (voiceInputRef.current) {
          voiceInputRef.current.toggle();
      }
  }, []);

  const handleGenerateTrigger = useCallback(() => {
      if (!isGenerating && !generatedImage) {
          handleGenerate();
      }
  }, [isGenerating, generatedImage, canvasDataUrl, prompt, selectedStyle]); 

  const handleSaveToGallery = useCallback(() => {
      if (generatedImage) {
          const newItem: GalleryItem = {
              id: Date.now().toString(),
              url: generatedImage,
              // Use resultPrompt (the one used for generation) instead of current input prompt
              prompt: resultPrompt || '', 
              style: selectedStyle,
              timestamp: Date.now()
          };
          setGallery(prev => [newItem, ...prev]);
          setGeneratedImage(null); // Close preview after saving
          setError(null); 
          // Note: AirCanvas will show "Saving..." toast automatically
      }
  }, [generatedImage, resultPrompt, selectedStyle]);

  // Memoize transcript handler to keep VoiceInput stable
  const handleTranscript = useCallback((text: string) => {
    setPrompt((prev) => prev ? `${prev} ${text}` : text);
  }, []);

  const deleteFromGallery = (id: string) => {
      setGallery(prev => prev.filter(item => item.id !== id));
  };
  
  // Quick Style Switch Handler (Re-generate with same sketch)
  const handleStyleSwitch = (style: ArtStyle) => {
      setSelectedStyle(style);
      // We need to wait for state to update, but handleGenerate uses current state.
      // A cleaner way is to pass args to generate, but for now we set state and rely on effect or user click.
      // To make it instant, we can call the service directly with the new style:
      
      setIsGenerating(true);
      setError(null);
      // Don't clear result yet, let it update in place
      
      // Use the existing canvas data and the EXISTING result prompt
      generateImageFromSketch(canvasDataUrl, resultPrompt, style)
        .then(result => {
             setGeneratedImage(result);
        })
        .catch(err => {
             setError(err.message || "Failed to transform.");
        })
        .finally(() => {
             setIsGenerating(false);
        });
  };

  return (
    <div className="h-screen flex flex-col bg-[#dfe8f5]">
      
      {/* 1. Title Bar */}
      <div className="bg-white border-b border-gray-300 flex items-center px-2 py-1 gap-2 text-xs select-none">
         <div className="flex gap-2 border-r border-gray-300 pr-2">
            <button className="hover:bg-gray-100 p-1 rounded" title="Save Project (Download)">
                <Save className="w-4 h-4 text-purple-700" />
            </button>
            <button onClick={handleUndo} className="hover:bg-gray-100 p-1 rounded" title="Undo">
                <Undo className="w-4 h-4 text-blue-600" />
            </button>
            <button className="hover:bg-gray-100 p-1 rounded disabled:opacity-30" disabled title="Redo">
                <Redo className="w-4 h-4 text-gray-400" />
            </button>
         </div>
         <div className="flex-1 text-center font-normal text-gray-700">
            Untitled - Sketch Air
         </div>
         <button onClick={() => setShowGallery(!showGallery)} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] ${showGallery ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}>
             <ImageIcon className="w-3 h-3" />
             Gallery ({gallery.length})
         </button>
      </div>

      {/* 2. The Ribbon UI */}
      <div className="bg-[#f5f6f7] border-b border-gray-300 px-1 py-1 flex gap-1 h-32 select-none shadow-sm z-20">
         
         {/* Group: Image */}
         <div className="flex flex-col border-r border-gray-300 px-2 min-w-[70px]">
            <div className="flex-1 flex flex-col items-center justify-center gap-1 group cursor-pointer" onClick={() => generatedImage && handleDownload(generatedImage)} title="Download Result">
                <div className={`p-2 rounded hover:bg-[#cce8ff] hover:border hover:border-[#99d1ff] ${!generatedImage ? 'opacity-50 grayscale' : ''}`}>
                    <Download className="w-8 h-8 text-blue-600" />
                </div>
                <span className="text-[11px] text-gray-600 group-hover:text-black">Save File</span>
            </div>
            <div className="text-center text-[11px] text-gray-500 mt-1">File</div>
         </div>

         {/* Group: Tools */}
         <div className="flex flex-col border-r border-gray-300 px-3 min-w-[200px]">
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
                    <VoiceInput 
                        ref={voiceInputRef}
                        onTranscript={handleTranscript} 
                        isProcessing={isGenerating} 
                    />
                 </div>
                 
                 <div className="flex gap-2 items-center">
                    {/* Clear Button */}
                    <button onClick={handleClear} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-[#cce8ff] border border-transparent hover:border-[#99d1ff] rounded">
                        <Eraser className="w-4 h-4 text-red-500" />
                        <span>Clear</span>
                    </button>
                    {/* Size Slider */}
                    <div className="flex items-center gap-2 ml-2 border-l border-gray-200 pl-2">
                         <span className="text-[10px] text-gray-500 font-bold">Size:</span>
                         <input 
                            type="range" 
                            min="1" 
                            max="20" 
                            value={strokeWidth} 
                            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                            className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                         />
                         <div className="w-3 h-3 rounded-full bg-black" style={{ width: strokeWidth/1.5, height: strokeWidth/1.5 }}></div>
                    </div>
                 </div>
            </div>
            <div className="text-center text-[11px] text-gray-500 mt-1">Tools</div>
         </div>

         {/* Group: Colors */}
         <div className="flex flex-col border-r border-gray-300 px-2 min-w-[140px]">
            <div className="flex-1 flex flex-col justify-center gap-1">
                <div className="grid grid-cols-4 gap-1">
                    {PRESET_COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => setStrokeColor(color)}
                            className={`w-6 h-6 rounded-sm border hover:scale-110 transition-transform ${strokeColor === color ? 'border-2 border-black shadow-sm' : 'border-gray-300'}`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-2 mt-1 bg-white border border-gray-200 p-1 rounded">
                     <input 
                        type="color" 
                        value={strokeColor} 
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="w-6 h-6 p-0 border-0 cursor-pointer"
                        title="Custom Color"
                     />
                     <span className="text-[10px] text-gray-500">Edit Colors</span>
                </div>
            </div>
            <div className="text-center text-[11px] text-gray-500 mt-1">Colors</div>
         </div>

         {/* Group: Styles */}
         <div className="flex flex-col border-r border-gray-300 px-2 flex-1 max-w-sm">
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

         {/* Group: Generate */}
         <div className="flex flex-col px-4 min-w-[100px]">
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

      {/* 3. Main Workspace Area (FULL SCREEN with Sidebar) */}
      <div className="flex-1 flex overflow-hidden bg-[#e0e4eb]">
         
         {/* Canvas Area */}
         <div className="relative flex-1 bg-black">
            
            {/* Error Message Bar */}
            {error && (
                <div className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 text-xs px-2 py-1 border-b border-red-300 z-50 text-center">
                    {error}
                </div>
            )}

            {/* Air Canvas: Always rendered, but ink layer hidden if result is showing.
                Prop isResultVisible keeps tracking active but disables drawing. */}
            <div className="w-full h-full">
                <AirCanvas 
                  ref={airCanvasRef}
                  onCanvasUpdate={handleCanvasUpdate}
                  onVoiceTrigger={handleVoiceTrigger}
                  onGenerateTrigger={handleGenerateTrigger} 
                  onSaveTrigger={handleSaveToGallery}
                  isDrawingMode={true} 
                  strokeColor={strokeColor}
                  strokeWidth={strokeWidth}
                  isResultVisible={!!generatedImage}
                />
            </div>

            {/* Generated Image Overlay (Result) - Sits ON TOP of canvas, but lets gestures pass through logic via AirCanvas props */}
            {generatedImage && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 flex items-center justify-center p-8">
                    <div className="relative max-w-4xl max-h-full bg-white p-2 rounded-lg shadow-2xl border border-gray-600 flex flex-col">
                        <img src={generatedImage} alt="Result" className="max-h-[60vh] object-contain border border-gray-200" />
                        
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-4">
                                <span className="italic">"{resultPrompt}"</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-emerald-600 animate-pulse font-bold bg-emerald-50 px-2 py-1 rounded">
                                    <span>🤟 Show 3 Fingers to Save</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Style Switcher (NEW) */}
                        <div className="mt-2 border-t border-gray-200 pt-2 grid grid-cols-3 gap-2">
                            {Object.values(ArtStyle).map(style => (
                                <button
                                    key={style}
                                    onClick={() => handleStyleSwitch(style)}
                                    disabled={isGenerating}
                                    className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded border transition-colors ${
                                        isGenerating ? 'opacity-50 cursor-wait' : 'hover:bg-purple-50 hover:border-purple-300'
                                    } ${selectedStyle === style ? 'bg-purple-100 border-purple-400 text-purple-900' : 'bg-white border-gray-200 text-gray-600'}`}
                                >
                                    {isGenerating && selectedStyle === style ? (
                                         <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                         <span>{style}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => setGeneratedImage(null)}
                            className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

         </div>

         {/* Gallery Sidebar */}
         {showGallery && (
             <div className="w-64 bg-white border-l border-gray-300 flex flex-col shadow-xl z-30">
                 <div className="p-3 border-b border-gray-200 font-semibold text-gray-700 flex justify-between items-center bg-gray-50">
                     <span>Saved Gallery</span>
                     <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{gallery.length}</span>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 space-y-3">
                     {gallery.length === 0 ? (
                         <div className="text-center text-gray-400 mt-10 text-sm italic p-4">
                             No images saved yet.<br/><br/>
                             Use the 🤟 3-finger gesture when viewing a result to save it here!
                         </div>
                     ) : (
                         gallery.map((item) => (
                             <div key={item.id} className="group relative border border-gray-200 rounded-md overflow-hidden bg-gray-50 hover:shadow-md transition-shadow">
                                 <img src={item.url} alt={item.prompt} className="w-full h-32 object-cover" />
                                 <div className="p-2">
                                     <p className="text-[10px] font-bold text-gray-700 truncate">{item.prompt}</p>
                                     <p className="text-[9px] text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                                 </div>
                                 {/* Hover Actions */}
                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                     <button onClick={() => handleDownload(item.url)} className="p-1.5 bg-white text-blue-600 rounded-full hover:bg-blue-50" title="Download">
                                         <Download className="w-4 h-4" />
                                     </button>
                                     <button onClick={() => deleteFromGallery(item.id)} className="p-1.5 bg-white text-red-600 rounded-full hover:bg-red-50" title="Delete">
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                 </div>
                             </div>
                         ))
                     )}
                 </div>
             </div>
         )}

      </div>

      {/* 4. Status Bar */}
      <div className="bg-[#f0f0f0] border-t border-gray-300 px-2 py-1 text-[11px] flex items-center justify-between text-gray-600 select-none">
          <div className="flex gap-4">
              <span className="flex items-center gap-1"><MousePointer2 className="w-3 h-3"/> Canvas: Full Screen</span>
              <span className="border-l border-gray-300 pl-4">Color: <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor: strokeColor}}></span></span>
              <span className="border-l border-gray-300 pl-4">Size: {strokeWidth}px</span>
          </div>
          <div>
              Built with ❤️
          </div>
      </div>

    </div>
  );
}

export default App;