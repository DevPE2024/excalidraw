// utils/canvasHelpers.ts

/**
 * Helpers para manipular o canvas Excalidraw
 */

export interface CanvasImageOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Carregar imagem de URL ou base64
 */
export async function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Para imagens externas

    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error("Erro ao carregar imagem"));

    img.src = url;
  });
}

/**
 * Converter imagem para File
 */
export async function imageUrlToFile(
  url: string,
  filename: string = "generated-image.png",
): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: "image/png" });
}

/**
 * Inserir imagem no canvas Excalidraw
 *
 * Fluxo:
 * 1. Carregar imagem da URL
 * 2. Converter para File
 * 3. Adicionar ao Excalidraw usando API de files
 * 4. Posicionar no canvas
 */
export async function insertImageIntoCanvas(
  excalidrawAPI: any, // API do Excalidraw
  imageUrl: string,
  options: CanvasImageOptions = {},
): Promise<void> {
  try {
    // 1. Carregar imagem para obter dimensÃµes
    const img = await loadImageFromUrl(imageUrl);

    // 2. Converter para File
    const file = await imageUrlToFile(
      imageUrl,
      `ai-generated-${Date.now()}.png`,
    );

    // 3. Calcular posiÃ§Ã£o central se nÃ£o especificada
    const appState = excalidrawAPI.getAppState();
    const centerX = options.x ?? appState.width / 2;
    const centerY = options.y ?? appState.height / 2;

    // 4. Calcular dimensÃµes mantendo aspect ratio
    const maxWidth = options.width ?? 800;
    const maxHeight = options.height ?? 800;

    let width = img.width;
    let height = img.height;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = width * ratio;
      height = height * ratio;
    }

    // 5. Adicionar arquivo ao Excalidraw
    const fileId = await excalidrawAPI.addFiles([file]);

    // 6. Criar elemento de imagem
    const imageElement = {
      type: "image",
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
      fileId: fileId[0],
      status: "saved",
      scale: [1, 1],
    };

    // 7. Adicionar ao canvas
    excalidrawAPI.updateScene({
      elements: [...excalidrawAPI.getSceneElements(), imageElement],
    });

    // 8. Centralizar viewport na imagem
    excalidrawAPI.scrollToContent(imageElement, {
      fitToContent: false,
      animate: true,
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Obter posiÃ§Ã£o central do viewport atual
 */
export function getCanvasCenter(excalidrawAPI: any): { x: number; y: number } {
  const appState = excalidrawAPI.getAppState();
  const { scrollX, scrollY, width, height, zoom } = appState;

  return {
    x: -scrollX + width / 2 / zoom.value,
    y: -scrollY + height / 2 / zoom.value,
  };
}
