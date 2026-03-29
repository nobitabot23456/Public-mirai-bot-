import axios from "axios";

/**
 * Utility functions for the bot
 */
export async function getStreamFromURL(url: string, path: string): Promise<any> {
    const response = await axios.get(url, { responseType: "stream" });
    // Add path metadata to the stream if needed by FCA
    (response.data as any).path = path;
    return response.data;
}
