import React, { useCallback, useState, FormEvent } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Trash2 } from "lucide-react";
import { Progress } from "./ui/progress";
import mammoth from "mammoth";
import useUploadStatus from "../store/useUploadStatus";
import { toast } from "sonner";
import { API_URL } from "../config";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker.entry";
import useAuthStore from "../store/useAuthStore";

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
  restaurantId: number;
}

const MyDropzone: React.FC<MyDropzoneProps> = ({
  FileUpload = { File: null, extractedText: "" },
  setFileUpload,
  onMenuProcessed,
  restaurantId,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUploading, setUploadProgress, uploadProgress } = useUploadStatus();
  const [currentStep, setCurrentStep] = useState(1);
  const [processingStep, setProcessingStep] = useState("");
  const { user } = useAuthStore.getState();

  const resetUploadState = () => {
    setIsUploading(false);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    setCurrentStep(1);
    setProcessingStep("");
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploading(true);
    setUploadProgress(0);
    let extractedText = "";
    try {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map((item: any) => item.str).join(" ") + "\n";
          setUploadProgress(10 + (i / pdf.numPages) * 10);
        }
        extractedText = textContent;
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "application/msword"
      ) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
        setUploadProgress(20);
      } else if (file.type === "text/plain") {
        extractedText = await file.text();
        setUploadProgress(20);
      } else {
        throw new Error("Unsupported file type!");
      }
      if (!extractedText.trim()) {
        throw new Error("No text content could be extracted from the file.");
      }
      toast.success("Text extraction complete!");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error processing file.");
      toast.error(`File processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    return extractedText;
  };

  const OPENAI_KEY = import.meta.env.VITE_PUBLIC_OPENAI_API_KEY;

  const processBasicJSON = async (textContent: string) => {
    setProcessingStep("Creating basic JSON structure...");
    try {
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
          temperature: 0.3,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid API response format");
      }
      const basicJSON = JSON.parse(data.choices[0].message.content);
      setUploadProgress(50);
      return basicJSON;
    } catch (error) {
      throw new Error("Failed to create basic JSON structure");
    }
  };

  const processEnhancedJSON = async (items: any[]) => {
    const halfLength = Math.floor(items.length / 2);
    const firstBatch = items.slice(0, halfLength);
    const secondBatch = items.slice(halfLength);
    setProcessingStep("Enhancing JSON with additional fields...");
    const enhanceItems = async (batchItems: any[], batchNumber: number) => {
      try {
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
            temperature: 0.3,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
          throw new Error("Invalid API response format");
        }
        const enhancedItems = JSON.parse(data.choices[0].message.content);
        enhancedItems.forEach((item: any, index: number) => {
          const originalItem = batchItems[index];
          if (item.id !== originalItem.id || item.name !== originalItem.name || item.price !== originalItem.price) {
            throw new Error(`Enhanced item ${index} doesn't match original fields`);
          }
        });
        return enhancedItems;
      } catch (error) {
        throw error;
      }
    };
    try {
      const enhancedFirstBatch = await enhanceItems(firstBatch, 1);
      setUploadProgress(65);
      let finalResult = enhancedFirstBatch;
      if (secondBatch.length > 0) {
        setProcessingStep("Processing second batch...");
        const enhancedSecondBatch = await enhanceItems(secondBatch, 2);
        finalResult = [...enhancedFirstBatch, ...enhancedSecondBatch];
        setUploadProgress(75);
      }
      setProcessingStep("Generating menu summary...");
      const menuSummary = await generateMenuSummary(finalResult);
      setUploadProgress(85);
      const menuUpdateResponse = await fetch(`${API_URL}/restaurant/updateMenu/${restaurantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuItems: finalResult,
          adminUsername: user.username,
          customisations: [],
        }),
      });
      if (!menuUpdateResponse.ok) {
        throw new Error("Failed to update menu items");
      }
      const restaurantUpdateResponse = await fetch(`${API_URL}/restaurant/updateRestaurant/${restaurantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuSummary: menuSummary,
          adminUsername: user.username,
        }),
      });
      if (!restaurantUpdateResponse.ok) {
        throw new Error("Failed to update menu summary");
      }
      setUploadProgress(100);
      toast.success("Menu and summary updated successfully!");
      onMenuProcessed(finalResult);
      setTimeout(() => {
        resetUploadState();
      }, 1500);
      return finalResult;
    } catch (error) {
      throw new Error(`Failed to enhance JSON with additional fields: ${error.message}`);
    }
  };

  const generateMenuSummary = async (menuItems: any[]) => {
    try {
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
              content: `You are a restaurant menu summarizer. Create a concise 30-word summary highlighting the key offerings, cuisines, and special features of the menu. Focus on variety, specialties, and unique aspects.`,
            },
            {
              role: "user",
              content: `Create a 30-word summary for this menu: ${JSON.stringify(menuItems)}`,
            },
          ],
          max_tokens: 100,
          temperature: 0.6,
        }),
      });
      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Failed to generate menu summary");
      }
      return data.choices[0].message.content.trim();
    } catch (error) {
      throw error;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      resetUploadState();
      const file = acceptedFiles[0];
      try {
        toast.info("Uploading and processing your file, please wait...");
        const textContent = await extractTextFromFile(file);
        setFileUpload({ File: file, extractedText: textContent });
        setCurrentStep(1);
        const basicItems = await processBasicJSON(textContent);
        toast.success("Basic JSON structure created successfully!");
        setCurrentStep(2);
        await processEnhancedJSON(basicItems);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
        toast.error("Failed to structure the menu. Please try again.");
      }
    },
    [setFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 15485760,
    multiple: false,
  });

  const handleRemoveFile = (e: FormEvent) => {
    e.stopPropagation();
    setFileUpload({ File: null, extractedText: "" });
    resetUploadState();
  };

  return (
    <div className="border-primary p-4 bg-modal-inputBox rounded-xl shadow-md">
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
          <Progress value={uploadProgress} className="w-full h-2 bg-gray-200" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            {isUploading
              ? "Processing file..."
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
