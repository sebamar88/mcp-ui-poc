import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchPostDetails } from "#src/services/postService";
import type { PostDetails } from "#src/services/postService";
import {
    buildPostRemoteDomResource,
    buildPostSummaryResource,
} from "#src/services/uiResourceService";
import type { UIResource } from "#src/types/ui";
import { extractErrorMessage } from "#src/utils/errorHandling";

export function usePostResource(postId: number | null) {
    const query = useQuery<PostDetails, Error>({
        queryKey: ["postDetails", postId],
        enabled: Boolean(postId),
        queryFn: () => fetchPostDetails(postId as number),
    });

    const { htmlResource, remoteDomResource } = useMemo(() => {
        if (!query.data) {
            return {
                htmlResource: null as UIResource | null,
                remoteDomResource: null as UIResource | null,
            };
        }

        return {
            htmlResource: buildPostSummaryResource(query.data),
            remoteDomResource: buildPostRemoteDomResource(query.data),
        };
    }, [query.data]);

    const errorMessage = useMemo(
        () =>
            query.error
                ? extractErrorMessage(
                      query.error,
                      "No se pudo construir la UI del post seleccionado."
                  )
                : null,
        [query.error]
    );

    return {
        details: query.data ?? null,
        htmlResource,
        remoteDomResource,
        isLoading: query.isPending,
        isFetching: query.isFetching,
        error: errorMessage,
        hasResource: Boolean(htmlResource && query.data),
        refresh: query.refetch,
    };
}
