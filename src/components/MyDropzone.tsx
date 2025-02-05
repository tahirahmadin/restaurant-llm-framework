import React, { useCallback, useState, FormEvent, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Trash2 } from "lucide-react";
import { Progress } from "./ui/progress";
import mammoth from "mammoth";
import useUploadStatus from "../store/useUploadStatus";
import { toast } from "sonner";
import { API_URL } from "../config";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker.entry"; // Ensures worker is loaded correctly

// Set worker source
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js`;


interface FileUploadState {
  File: File | null;
  extractedText?: string; 
}

interface MenuItem {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    spicinessLevel: number;
    sweetnessLevel: number;
    dietaryPreference: string[];
    healthinessScore: number;
    caffeineLevel: string;
    sufficientFor: number;
    available: boolean;
  }

interface MyDropzoneProps {
  FileUpload?: FileUploadState;
  setFileUpload: (file: FileUploadState) => void;
  onMenuProcessed: (menuItems: MenuItem[]) => void;
  restaurantId: string;
}

const MyDropzone: React.FC<MyDropzoneProps> = ({ FileUpload = { File: null, extractedText: "" }, setFileUpload, onMenuProcessed,restaurantId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUploading, setUploadProgress, uploadProgress } = useUploadStatus();
  const [processedBasicJSON, setProcessedBasicJSON] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [processingStep, setProcessingStep] = useState<string>("");

  const resetUploadState = () => {
    setIsUploading(false);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    setProcessedBasicJSON([]);
    setCurrentStep(1);
    setProcessingStep("");
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploading(true);
    setUploadProgress(10);
    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let textContent = "";
  
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map((item: any) => item.str).join(" ") + "\n";
        }
  
        extractedText = textContent;
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "application/msword"
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.type === "text/plain") {
        extractedText = await file.text();
      } else {
        throw new Error("Unsupported file type!");
      }

      if (!extractedText.trim()) {
        throw new Error("No text content could be extracted from the file.");
      }

      setUploadProgress(100);
      toast.success("Text extracted successfully!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error processing file.");
      toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploading(false);
      }, 500);
    }

    return extractedText;
  };

  const OPENAI_KEY = import.meta.env.VITE_PUBLIC_OPENAI_API_KEY;

  const processBasicJSON = async (textContent: string) => {
    setProcessingStep("Creating basic JSON structure...");
    try {
      console.log("Starting basic JSON conversion with text:", textContent.substring(0, 200) + "...");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a precise JSON converter for menu items. Your response must be ONLY a raw JSON array without any markdown formatting, code blocks, or additional text. Never include \`\`\`json or \`\`\` markers.

              Convert menu items to a JSON array where each item has this exact structure:
              {
                "id": (auto-increment starting from 1),
                "name": (item name as string),
                "description": (brief item description as string(10-15 words)),
                "category": (derive from context, e.g., "Desserts", "Beverages", etc.),
                "price": (number only, no currency symbols)
              }
              
              Rules:
              1. Start response directly with [ and end with ]
              2. No markdown, no code blocks, no extra text
              3. Include ALL menu items from the input
              4. Ensure each item has all required fields
              5. Use consistent category names
              6. Auto-generate IDs starting from 1
              7. If price is not provided, use 0
              8. Clean and normalize text, removing special characters`
            },
            {
              role: "user",
              content: `Convert these menu items to a JSON array. Return only the raw JSON array, no markdown or code blocks:\n${textContent}`
            }
          ],
          max_tokens: 16000,
          temperature: 0.3
        }),
      });

      const data = await response.json();
      console.log("Basic JSON API Response:", data);
      
      if (!response.ok) {
        console.error("API Error in basic JSON conversion:", data);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      if (!data.choices?.[0]?.message?.content) {
        console.error("Invalid API response format for basic JSON:", data);
        throw new Error('Invalid API response format');
      }

      console.log("Raw API Response content:", data.choices[0].message.content);
      const basicJSON = JSON.parse(data.choices[0].message.content);
      console.log("Parsed basic JSON:", basicJSON);
      setProcessedBasicJSON(basicJSON);
      return basicJSON;
    } catch (error) {
      throw new Error("Failed to create basic JSON structure");
    }
  };

  const processEnhancedJSON = async (items: any[]) => {
    const isEven = items.length % 2 === 0;
    const halfLength = Math.floor(items.length / 2);
    const firstBatch = items.slice(0, halfLength);
    const secondBatch = items.slice(halfLength);

    setProcessingStep("Enhancing JSON with additional fields...");

    const enhanceItems = async (batchItems: any[], batchNumber: number) => {
      try {
        console.log(`Processing batch ${batchNumber} with ${batchItems.length} items:`, batchItems);
        
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                {
                  role: "system",
                  content: `You are a JSON enhancer that adds fields to menu items. Your response must be ONLY a raw JSON array without any markdown, code blocks, or additional text. Never use \`\`\`json or \`\`\` markers.
  
                  Maintain existing fields and add new ones in this exact format, starting directly with [ and ending with ]:
                  {
                    "id": (keep existing),
                    "name": (keep existing),
                    "description": (keep existing),
                    "category": (keep existing),
                    "price": (keep existing),
                    "spicinessLevel": (number 0-5),
                    "sweetnessLevel": (number 0-5),
                    "dietaryPreference": ["Vegetarian"] or ["Non-Vegetarian"],
                    "healthinessScore": (number 1-5),
                    "caffeineLevel": "None" or "Low" or "Medium" or "High",
                    "sufficientFor": (number),
                    "available": (boolean)
                  }
                  
                  Rules:
                  1. Start response directly with [ and end with ]
                  2. No markdown, no code blocks, no extra text
                  3. Maintain ALL existing field values exactly as provided
                  4. Add all new fields with appropriate values
                  5. Return only the raw JSON array`
                },
                {
                  role: "user",
                  content: `Enhance these menu items by adding the specified fields. Return only the raw JSON array without any markdown or formatting:\n${JSON.stringify(batchItems, null, 2)}`
                }
            ],
            max_tokens: 16000,
            temperature: 0.3
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`API Error for batch ${batchNumber}:`, errorData);
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Raw API response for batch ${batchNumber}:`, data);
        
        if (!data.choices?.[0]?.message?.content) {
          console.error(`Invalid API response format for batch ${batchNumber}:`, data);
          throw new Error('Invalid API response format');
        }

        try {
          const content = data.choices[0].message.content;
          console.log(`Content before parsing for batch ${batchNumber}:`, content);
          const enhancedItems = JSON.parse(content);
          console.log(`Successfully processed batch ${batchNumber}:`, enhancedItems);
          
          // Validate the enhanced items maintain original fields
          enhancedItems.forEach((item: any, index: number) => {
            const originalItem = batchItems[index];
            if (item.id !== originalItem.id || 
                item.name !== originalItem.name || 
                item.price !== originalItem.price) {
              throw new Error(`Enhanced item ${index} doesn't match original fields`);
            }
          });
          
          return enhancedItems;
        } catch (parseError) {
          console.error(`JSON parse error for batch ${batchNumber}:`, {
            error: parseError,
            content: data.choices[0].message.content
          });
          throw new Error(`Failed to parse enhanced items JSON: ${parseError.message}`);
        }
      } catch (error) {
        console.error(`Error processing batch ${batchNumber}:`, error);
        throw error;
      }
    };

    try {
      const enhancedFirstBatch = await enhanceItems(firstBatch, 1);
      let finalResult = enhancedFirstBatch;
    
      // Process second batch if it exists
      if (secondBatch.length > 0) {
        setProcessingStep("Processing second batch...");
        const enhancedSecondBatch = await enhanceItems(secondBatch, 2);
        finalResult = [...enhancedFirstBatch, ...enhancedSecondBatch];
      }
    
      // Add these debug logs
      console.log('About to save menu with:', {
        restaurantId,
        menuItemsCount: finalResult.length,
        firstItem: finalResult[0],
      });
    
      // Make API call with detailed error handling
      try {
        const apiPayload = {
          menuItems: finalResult,
          customisations: []
        };
    
        console.log('Sending to API:', {
          url: `${API_URL}/api/restaurants/${restaurantId}/menu`,
          payload: JSON.stringify(apiPayload, null, 2)
        });
    
        const response = await fetch(`${API_URL}/api/restaurants/${restaurantId}/menu`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiPayload)
        });
    
        const responseData = await response.json();
        console.log('API Response:', responseData);
    
        if (!response.ok) {
          throw new Error(`Server error: ${responseData.error || 'Unknown error'}`);
        }
    
        // Log successful save
        console.log('Menu saved successfully:', responseData);
        toast.success('Menu saved to database successfully!');
      } catch (error) {
        console.error('Error saving to database:', error);
        toast.error(`Failed to save menu: ${error.message}`);
        throw error;
      }
    
      onMenuProcessed(finalResult);
      return finalResult;
    } catch (error) {
      console.error("Enhancement process failed:", error);
      throw new Error(`Failed to enhance JSON with additional fields: ${error.message}`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    resetUploadState();
    const file = acceptedFiles[0];
    
    try {
      // Step 1: Extract text
      toast.info("Processing file...");
      const textContent = await extractTextFromFile(file);
      console.log("Extracted text content:", textContent);
      setFileUpload({ File: file, extractedText: textContent });
      
      // Step 2: Create basic JSON
      setCurrentStep(1);
      console.log("Starting Step 2: Creating basic JSON");
      const basicItems = await processBasicJSON(textContent);
      console.log("Basic JSON creation completed:", basicItems);
      toast.success("Basic JSON created!");
      
      // Step 3: Enhance JSON in batches
      setCurrentStep(2);
      console.log("Starting Step 3: Enhancing JSON in batches");
      const enhancedItems = await processEnhancedJSON(basicItems);
      console.log("Final Enhanced Menu JSON:", JSON.stringify(enhancedItems, null, 2));
      toast.success("Menu structured successfully!");
    } catch (error) {
      console.error("Error processing menu:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Failed to structure menu.");
    }
  }, [setFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 15485760, // 15MB
    multiple: false,
  });

  const handleRemoveFile = (e: FormEvent) => {
    e.stopPropagation();
    setFileUpload({ File: null, extractedText: "" });
    resetUploadState();
  };

  return (
    <div className="border-primary p-4 bg-modal-inputBox rounded-xl shadow-md">
      {/* 
        Added "cursor-pointer" to the container div below, 
        so clicking anywhere in this area should open the file dialog. 
      */}
      <div {...getRootProps()} className="outline-none cursor-pointer">
        <input {...getInputProps()} />
        {isDragActive ? (
          <div className="lg:px-24 cursor-pointer flex flex-col text-primary items-center">
            <Upload className="w-8 h-8 text-muted-foreground animate-bounce" />
            <p className="text-center break-words text-sm animate-pulse">Drop the file here</p>
          </div>
        ) : (
          <>
            {FileUpload.File ? (
              <div className="px-10 lg:px-24 cursor-pointer flex flex-col text-primary items-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-center break-words text-sm">{FileUpload.File.name}</p>
                {!isUploading && (
                  <button
                    type="button"
                    className="mt-2 flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
                    onClick={handleRemoveFile}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove File
                  </button>
                )}
              </div>
            ) : (
              <div className="px-8 lg:px-24 cursor-pointer flex flex-col text-primary items-center">
                <Upload className="w-8 h-8 text-muted-foreground animate-pulse" />
                <p className="text-center break-words text-sm animate-pulse">Upload file</p>
                <p className="text-center break-words text-xs text-muted-foreground mt-2">
                  Drop or click to upload PDF, DOCX, DOC, or TXT files (max 15MB)
                </p>
              </div>
            )}
          </>
        )}
      </div>
  
      {(isUploading || processingStep) && (
        <div className="w-full mt-6">
          <Progress
            value={currentStep === 1 ? 50 : uploadProgress}
            className="w-full h-2 bg-gray-200"
          />
          <p className="text-center text-sm text-muted-foreground mt-2">
            {isUploading
              ? `Processing file... ${uploadProgress}%`
              : `Step ${currentStep}/2: ${processingStep}`}
          </p>
        </div>
      )}
  
      {error && (
        <div className="mt-4 p-2 bg-red-50 text-red-500 text-sm rounded text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default MyDropzone;