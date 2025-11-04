import { useEffect, useState } from "react";
import type { UIResource } from "#src/types/ui";

interface MCPMessage {
    type: string;
    data: unknown;
}

interface MCPState {
    resource: UIResource | null;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    messages: MCPMessage[];
}

export function useSSEPostResource(
    postId: number | null,
    mode: "html" | "remote" = "html"
) {
    const [state, setState] = useState<MCPState>({
        resource: null,
        isConnected: false,
        isLoading: false,
        error: null,
        messages: [],
    });

    useEffect(() => {
        if (!postId) {
            setState((prev) => ({
                ...prev,
                resource: null,
                isConnected: false,
                isLoading: false,
                error: null,
            }));
            return;
        }

        setState((prev) => ({
            ...prev,
            isLoading: true,
            error: null,
            messages: [],
        }));

        // Función para llamar al protocolo MCP
        const fetchPostFromMCP = async () => {
            try {
                setState((prev) => ({
                    ...prev,
                    messages: [...prev.messages, { type: "connecting", data: "Conectando al servidor MCP..." }],
                }));

                // Primero obtenemos el recurso usando resources/read
                const response = await fetch("https://mcp-ui-poc-ten.vercel.app/api/simple-mcp", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "resources/read",
                        params: {
                            uri: `post://${postId}`,
                        },
                        id: 1,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                setState((prev) => ({
                    ...prev,
                    isConnected: true,
                    messages: [...prev.messages, { type: "connected", data: "Conectado al servidor MCP" }],
                }));

                if (result.error) {
                    throw new Error(result.error.message || "Error del servidor MCP");
                }

                if (result.result && result.result.contents) {
                    const content = result.result.contents[0];
                    
                    // Crear el recurso UI compatible
                    const uiResource: UIResource = {
                        type: "resource",
                        resource: {
                            uri: `post://${postId}`,
                            mimeType: content.mimeType || "text/html",
                            text: content.text || content.blob || "",
                        },
                    };

                    setState((prev) => ({
                        ...prev,
                        resource: uiResource,
                        isLoading: false,
                        messages: [...prev.messages, { type: "resource", data: "Recurso recibido" }],
                    }));
                } else {
                    throw new Error("No se encontró contenido en la respuesta");
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Error desconocido";
                setState((prev) => ({
                    ...prev,
                    error: errorMessage,
                    isLoading: false,
                    isConnected: false,
                    messages: [...prev.messages, { type: "error", data: errorMessage }],
                }));
            }
        };

        fetchPostFromMCP();
    }, [postId, mode]);

    // Función para reconectar manualmente
    const reconnect = () => {
        setState((prev) => ({ 
            ...prev, 
            error: null,
            messages: [...prev.messages, { type: "reconnecting", data: "Reconectando..." }]
        }));
        // El useEffect se ejecutará de nuevo debido al cambio de estado
    };

    return {
        ...state,
        reconnect,
    };
}
