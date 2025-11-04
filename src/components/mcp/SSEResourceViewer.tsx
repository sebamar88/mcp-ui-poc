import { useState } from "react";
import { useSSEPostResource } from "#src/hooks/useSSEPostResource";
import { ResourceViewer } from "#src/components/mcp/ResourceViewer";
import type { UIAction } from "#src/types/ui";

interface SSEResourceViewerProps {
    postId: number | null;
    onAction: (action: UIAction) => void;
}

export function SSEResourceViewer({
    postId,
    onAction,
}: SSEResourceViewerProps) {
    const [mode, setMode] = useState<"html" | "remote">("html");
    const { resource, isConnected, isLoading, error, messages, reconnect } =
        useSSEPostResource(postId, mode);

    return (
        <div
            style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "16px",
                marginTop: "16px",
            }}
        >
            <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>
                    � Servidor MCP (JSON-RPC)
                </h3>
                <p
                    style={{
                        margin: "0 0 12px 0",
                        fontSize: "14px",
                        color: "#666",
                    }}
                >
                    Conexión directa con el servidor MCP usando protocolo JSON-RPC 2.0
                </p>

                {/* Controles */}
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "12px",
                    }}
                >
                    <button
                        onClick={() => setMode("html")}
                        style={{
                            padding: "4px 8px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            backgroundColor:
                                mode === "html" ? "#007acc" : "white",
                            color: mode === "html" ? "white" : "black",
                            fontSize: "12px",
                        }}
                    >
                        HTML
                    </button>
                    <button
                        onClick={() => setMode("remote")}
                        style={{
                            padding: "4px 8px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            backgroundColor:
                                mode === "remote" ? "#007acc" : "white",
                            color: mode === "remote" ? "white" : "black",
                            fontSize: "12px",
                        }}
                    >
                        Remote DOM
                    </button>
                    <button
                        onClick={reconnect}
                        disabled={isLoading}
                        style={{
                            padding: "4px 8px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            backgroundColor: "white",
                            color: "black",
                            fontSize: "12px",
                        }}
                    >
                        🔄 Reconectar
                    </button>
                </div>

                {/* Estado de conexión */}
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        fontSize: "12px",
                        marginBottom: "12px",
                    }}
                >
                    <span
                        style={{ color: isConnected ? "#28a745" : "#dc3545" }}
                    >
                        ● {isConnected ? "Conectado" : "Desconectado"}
                    </span>
                    {isLoading && (
                        <span style={{ color: "#ffc107" }}>⏳ Cargando...</span>
                    )}
                    {error && (
                        <span style={{ color: "#dc3545" }}>❌ {error}</span>
                    )}
                </div>

                {/* URL del endpoint */}
                <div
                    style={{
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "16px",
                    }}
                >
                    <strong>MCP Endpoint:</strong>{" "}
                    <code
                        style={{
                            backgroundColor: "#f5f5f5",
                            padding: "2px 4px",
                            borderRadius: "3px",
                        }}
                    >
                        https://mcp-ui-poc-ten.vercel.app/api/simple-mcp
                    </code>
                    <br />
                    <strong>Método:</strong> resources/read
                    <br />
                    <strong>URI:</strong> post://{postId}
                </div>
            </div>

            {/* ResourceViewer */}
            {resource ? (
                <ResourceViewer
                    resource={resource}
                    isLoading={isLoading}
                    error={error}
                    onAction={onAction}
                    onRetry={reconnect}
                />
            ) : (
                <div
                    style={{
                        padding: "24px",
                        textAlign: "center",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        color: "#666",
                    }}
                >
                    {isLoading
                        ? "Esperando datos del servidor MCP..."
                        : "No hay recurso disponible"}
                </div>
            )}

            {/* Log de mensajes MCP */}
            <details style={{ marginTop: "16px" }}>
                <summary
                    style={{
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
                    }}
                >
                    📋 Log de mensajes MCP ({messages.length})
                </summary>
                <div
                    style={{
                        maxHeight: "200px",
                        overflow: "auto",
                        backgroundColor: "#f8f9fa",
                        padding: "8px",
                        borderRadius: "4px",
                        marginTop: "8px",
                    }}
                >
                    {messages.length === 0 ? (
                        <p
                            style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "#666",
                            }}
                        >
                            No hay mensajes aún
                        </p>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    fontSize: "11px",
                                    marginBottom: "4px",
                                    fontFamily: "monospace",
                                }}
                            >
                                <span
                                    style={{
                                        color: "#007acc",
                                        fontWeight: "bold",
                                    }}
                                >
                                    [{msg.type}]
                                </span>{" "}
                                <span style={{ color: "#333" }}>
                                    {typeof msg.data === "string"
                                        ? msg.data
                                        : JSON.stringify(msg.data)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </details>
        </div>
    );
}
