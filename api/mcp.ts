import type { IncomingMessage, ServerResponse } from "http";

import {
    buildPostRemoteDomResource,
    buildPostSummaryResource,
} from "../src/services/uiResourceService";
import { fetchPostDetails } from "../src/services/postService";

type VercelRequest = IncomingMessage & {
    query: Record<string, string | string[] | undefined>;
};

type VercelResponse = ServerResponse & {
    json: (body: unknown) => void;
    status: (code: number) => VercelResponse;
};

function parsePostId(queryValue: string | string[] | undefined): number {
    const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseMode(
    queryValue: string | string[] | undefined
): "html" | "remote" {
    const raw = (
        Array.isArray(queryValue) ? queryValue[0] : queryValue
    )?.toLowerCase();
    return raw === "remote" ? "remote" : "html";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const postId = parsePostId(req.query?.postId);
    const mode = parseMode(req.query?.mode);

    try {
        const details = await fetchPostDetails(postId);
        const resource =
            mode === "remote"
                ? buildPostRemoteDomResource(details)
                : buildPostSummaryResource(details);

        res.status(200).json(resource);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "Error desconocido al generar el recurso MCP.";
        res.status(500).json({
            error: "MCP_UI_RESOURCE_ERROR",
            message,
        });
    }
}
