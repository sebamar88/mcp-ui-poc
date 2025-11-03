import { useEffect, useRef, useState } from "react";
import type { UIResource } from "#src/types/ui";

interface SSEMessage {
    event: string;
    data: unknown;
}

interface SSEState {
    resource: UIResource | null;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    messages: SSEMessage[];
}

export function useSSEPostResource(
    postId: number | null,
    mode: "html" | "remote" = "html"
) {
    const [state, setState] = useState<SSEState>({
        resource: null,
        isConnected: false,
        isLoading: false,
        error: null,
        messages: [],
    });

    const eventSourceRef = useRef<EventSource | null>(null);

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

        // Cerrar conexión anterior si existe
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setState((prev) => ({
            ...prev,
            isLoading: true,
            error: null,
            messages: [],
        }));

        // Crear nueva conexión SSE
        const url = `/api/sse?postId=${postId}&mode=${mode}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setState((prev) => ({ ...prev, isConnected: true }));
        };

        eventSource.addEventListener("connected", (event) => {
            const messageEvent = event as MessageEvent;
            const data = JSON.parse(messageEvent.data);
            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, { event: "connected", data }],
            }));
        });

        eventSource.addEventListener("loading", (event) => {
            const messageEvent = event as MessageEvent;
            const data = JSON.parse(messageEvent.data);
            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, { event: "loading", data }],
            }));
        });

        eventSource.addEventListener("resource", (event) => {
            const messageEvent = event as MessageEvent;
            const resource = JSON.parse(messageEvent.data);
            setState((prev) => ({
                ...prev,
                resource,
                isLoading: false,
                messages: [
                    ...prev.messages,
                    { event: "resource", data: "Resource received" },
                ],
            }));
        });

        eventSource.addEventListener("completed", (event) => {
            const messageEvent = event as MessageEvent;
            const data = JSON.parse(messageEvent.data);
            setState((prev) => ({
                ...prev,
                messages: [...prev.messages, { event: "completed", data }],
            }));
        });

        eventSource.addEventListener("error", (event) => {
            const messageEvent = event as MessageEvent;
            const data = JSON.parse(messageEvent.data);
            setState((prev) => ({
                ...prev,
                error: data.message,
                isLoading: false,
                messages: [...prev.messages, { event: "error", data }],
            }));
        });

        eventSource.addEventListener("close", (event) => {
            const messageEvent = event as MessageEvent;
            const data = JSON.parse(messageEvent.data);
            setState((prev) => ({
                ...prev,
                isConnected: false,
                messages: [...prev.messages, { event: "close", data }],
            }));
            eventSource.close();
        });

        eventSource.onerror = () => {
            setState((prev) => ({
                ...prev,
                error: "Error de conexión SSE",
                isLoading: false,
                isConnected: false,
            }));
        };

        // Cleanup
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [postId, mode]);

    // Función para reconectar manualmente
    const reconnect = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        // Trigger re-render to restart the connection
        setState((prev) => ({ ...prev, error: null }));
    };

    return {
        ...state,
        reconnect,
    };
}
