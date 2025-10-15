import { useState } from "react";
import {
  DiagramToCodePlugin,
  exportToBlob,
  getTextFromElements,
  MIME_TYPES,
  TTDDialog,
} from "@excalidraw/excalidraw";
import { getDataURL } from "@excalidraw/excalidraw/data/blob";
import { safelyParseJSON } from "@excalidraw/common";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { AzureAIChat } from "./AzureAIChat";
import { AzureImageGenerator } from "./AzureImageGenerator";
import { isAzureAIConfigured } from "../services/azureAI";

export const AIComponents = ({
  excalidrawAPI,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
}) => {
  const [showChat, setShowChat] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const azureConfigured = isAzureAIConfigured();

  return (
    <>
      {/* Azure AI Chat Dialog */}
      {azureConfigured && showChat && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            zIndex: 9999,
          }}
        >
          <AzureAIChat
            onClose={() => setShowChat(false)}
            onGenerateDiagram={(data) => {
              try {
                // Parse and insert diagram data
                const parsedData = JSON.parse(data);
                console.log("Diagram data:", parsedData);
                // Here you would integrate with Excalidraw API to insert elements
                setShowChat(false);
              } catch (err) {
                console.error("Failed to parse diagram data:", err);
              }
            }}
          />
        </div>
      )}

      {/* Azure Image Generator Dialog */}
      {azureConfigured && showImageGen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
          }}
        >
          <AzureImageGenerator
            onClose={() => setShowImageGen(false)}
            onImageGenerated={(blob, prompt) => {
              console.log("Image generated:", prompt);
              // Here you would integrate with Excalidraw to insert the image
              // For now, just download it
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `affinify-${Date.now()}.png`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          />
        </div>
      )}

      <DiagramToCodePlugin
        generate={async ({ frame, children }) => {
          const appState = excalidrawAPI.getAppState();

          const blob = await exportToBlob({
            elements: children,
            appState: {
              ...appState,
              exportBackground: true,
              viewBackgroundColor: appState.viewBackgroundColor,
            },
            exportingFrame: frame,
            files: excalidrawAPI.getFiles(),
            mimeType: MIME_TYPES.jpg,
          });

          const dataURL = await getDataURL(blob);

          const textFromFrameChildren = getTextFromElements(children);

          const response = await fetch(
            `${
              import.meta.env.VITE_APP_AI_BACKEND
            }/v1/ai/diagram-to-code/generate`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                texts: textFromFrameChildren,
                image: dataURL,
                theme: appState.theme,
              }),
            },
          );

          if (!response.ok) {
            const text = await response.text();
            const errorJSON = safelyParseJSON(text);

            if (!errorJSON) {
              throw new Error(text);
            }

            if (errorJSON.statusCode === 429) {
              return {
                html: `<html>
                <body style="margin: 0; text-align: center">
                <div style="display: flex; align-items: center; justify-content: center; flex-direction: column; height: 100vh; padding: 0 60px">
                  <div style="color:red">Too many requests today,</br>please try again tomorrow!</div>
                  </br>
                  </br>
                  <div>You can also try <a href="${
                    import.meta.env.VITE_APP_PLUS_LP
                  }/plus?utm_source=excalidraw&utm_medium=app&utm_content=d2c" target="_blank" rel="noopener">Excalidraw+</a> to get more requests.</div>
                </div>
                </body>
                </html>`,
              };
            }

            throw new Error(errorJSON.message || text);
          }

          try {
            const { html } = await response.json();

            if (!html) {
              throw new Error("Generation failed (invalid response)");
            }
            return {
              html,
            };
          } catch (error: any) {
            throw new Error("Generation failed (invalid response)");
          }
        }}
      />

      <TTDDialog
        onTextSubmit={async (input) => {
          try {
            const response = await fetch(
              `${
                import.meta.env.VITE_APP_AI_BACKEND
              }/v1/ai/text-to-diagram/generate`,
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: input }),
              },
            );

            const rateLimit = response.headers.has("X-Ratelimit-Limit")
              ? parseInt(response.headers.get("X-Ratelimit-Limit") || "0", 10)
              : undefined;

            const rateLimitRemaining = response.headers.has(
              "X-Ratelimit-Remaining",
            )
              ? parseInt(
                  response.headers.get("X-Ratelimit-Remaining") || "0",
                  10,
                )
              : undefined;

            const json = await response.json();

            if (!response.ok) {
              if (response.status === 429) {
                return {
                  rateLimit,
                  rateLimitRemaining,
                  error: new Error(
                    "Too many requests today, please try again tomorrow!",
                  ),
                };
              }

              throw new Error(json.message || "Generation failed...");
            }

            const generatedResponse = json.generatedResponse;
            if (!generatedResponse) {
              throw new Error("Generation failed...");
            }

            return { generatedResponse, rateLimit, rateLimitRemaining };
          } catch (err: any) {
            throw new Error("Request failed");
          }
        }}
      />
    </>
  );
};
