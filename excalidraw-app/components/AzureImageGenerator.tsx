/**
 * Azure FLUX Image Generator Component
 * Provides AI-powered image generation for Affinify Canvas
 */

import { useState, useRef } from "react";
import { azureFLUX, type AzureFLUXGenerateRequest } from "../services/azureAI";

import "./AzureImageGenerator.scss";

interface AzureImageGeneratorProps {
  onClose?: () => void;
  onImageGenerated?: (imageBlob: Blob, prompt: string) => void;
}

type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";
type OutputFormat = "png" | "jpeg" | "webp";

export const AzureImageGenerator = ({
  onClose,
  onImageGenerated,
}: AzureImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>("1024x1024");
  const [format, setFormat] = useState<OutputFormat>("png");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<File | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const request: AzureFLUXGenerateRequest = {
        prompt: prompt.trim(),
        n: 1,
        size,
        output_format: format,
      };

      const response = await azureFLUX.generateImage(request);

      if (response.data && response.data[0]) {
        const imageData = response.data[0];

        if (imageData.b64_json) {
          // Convert base64 to blob
          const blob = await azureFLUX.generateImageFromBase64(imageData.b64_json);
          const imageUrl = URL.createObjectURL(blob);
          setGeneratedImage(imageUrl);

          if (onImageGenerated) {
            onImageGenerated(blob, prompt.trim());
          }
        } else if (imageData.url) {
          setGeneratedImage(imageData.url);
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro ao gerar imagem");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!imageToEdit || !prompt.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await azureFLUX.editImage({
        image: imageToEdit,
        prompt: prompt.trim(),
        n: 1,
        size,
      });

      if (response.data && response.data[0]) {
        const imageData = response.data[0];

        if (imageData.b64_json) {
          const blob = await azureFLUX.generateImageFromBase64(imageData.b64_json);
          const imageUrl = URL.createObjectURL(blob);
          setGeneratedImage(imageUrl);

          if (onImageGenerated) {
            onImageGenerated(blob, prompt.trim());
          }
        } else if (imageData.url) {
          setGeneratedImage(imageData.url);
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro ao editar imagem");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageToEdit(file);
        setEditMode(true);
        setError(null);
      } else {
        setError("Por favor, selecione um arquivo de imagem válido");
      }
    }
  };

  const handleDownload = () => {
    if (!generatedImage) {
      return;
    }

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `affinify-generated-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setEditMode(false);
    setImageToEdit(null);
    setGeneratedImage(null);
    setError(null);
    setPrompt("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="azure-image-gen">
      <div className="azure-image-gen__header">
        <div className="azure-image-gen__title">
          <span className="azure-image-gen__icon">🎨</span>
          <span>Affinify Image Generator</span>
        </div>
        {onClose && (
          <button
            className="azure-image-gen__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className="azure-image-gen__content">
        {/* Mode Selector */}
        <div className="azure-image-gen__mode">
          <button
            className={`azure-image-gen__mode-btn ${!editMode ? "active" : ""}`}
            onClick={() => {
              setEditMode(false);
              setImageToEdit(null);
            }}
          >
            ✨ Gerar Nova
          </button>
          <button
            className={`azure-image-gen__mode-btn ${editMode ? "active" : ""}`}
            onClick={() => setEditMode(true)}
          >
            ✏️ Editar Imagem
          </button>
        </div>

        {/* File Upload for Edit Mode */}
        {editMode && (
          <div className="azure-image-gen__upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              className="azure-image-gen__upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 {imageToEdit ? "Imagem Selecionada" : "Selecionar Imagem"}
            </button>
            {imageToEdit && (
              <span className="azure-image-gen__filename">{imageToEdit.name}</span>
            )}
          </div>
        )}

        {/* Prompt Input */}
        <div className="azure-image-gen__prompt">
          <label className="azure-image-gen__label">
            {editMode ? "Descreva as mudanças desejadas:" : "Descreva a imagem:"}
          </label>
          <textarea
            className="azure-image-gen__textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              editMode
                ? "Ex: Adicione um pôr do sol ao fundo, torne mais vibrante..."
                : "Ex: Um gato fofo em estilo cartoon, cores vibrantes..."
            }
            rows={4}
            disabled={isGenerating}
          />
        </div>

        {/* Settings */}
        <div className="azure-image-gen__settings">
          <div className="azure-image-gen__setting">
            <label className="azure-image-gen__label">Tamanho:</label>
            <select
              className="azure-image-gen__select"
              value={size}
              onChange={(e) => setSize(e.target.value as ImageSize)}
              disabled={isGenerating}
            >
              <option value="1024x1024">Quadrado (1024x1024)</option>
              <option value="1792x1024">Paisagem (1792x1024)</option>
              <option value="1024x1792">Retrato (1024x1792)</option>
            </select>
          </div>

          <div className="azure-image-gen__setting">
            <label className="azure-image-gen__label">Formato:</label>
            <select
              className="azure-image-gen__select"
              value={format}
              onChange={(e) => setFormat(e.target.value as OutputFormat)}
              disabled={isGenerating}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="azure-image-gen__error">❌ {error}</div>}

        {/* Generated Image Preview */}
        {generatedImage && (
          <div className="azure-image-gen__preview">
            <img
              src={generatedImage}
              alt="Generated"
              className="azure-image-gen__image"
            />
          </div>
        )}

        {/* Actions */}
        <div className="azure-image-gen__actions">
          {generatedImage && (
            <>
              <button
                className="azure-image-gen__button azure-image-gen__button--secondary"
                onClick={handleDownload}
              >
                💾 Baixar
              </button>
              <button
                className="azure-image-gen__button azure-image-gen__button--secondary"
                onClick={handleReset}
              >
                🔄 Nova Geração
              </button>
            </>
          )}
          <button
            className="azure-image-gen__button azure-image-gen__button--primary"
            onClick={editMode ? handleEdit : handleGenerate}
            disabled={
              isGenerating ||
              !prompt.trim() ||
              (editMode && !imageToEdit)
            }
          >
            {isGenerating
              ? "Gerando..."
              : editMode
                ? "🎨 Editar Imagem"
                : "✨ Gerar Imagem"}
          </button>
        </div>

        {/* Loading Indicator */}
        {isGenerating && (
          <div className="azure-image-gen__loading">
            <div className="azure-image-gen__spinner"></div>
            <p>
              {editMode
                ? "Editando sua imagem com IA..."
                : "Gerando sua imagem com IA..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

