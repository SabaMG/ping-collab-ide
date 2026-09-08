import { request } from './http';
import { getUser } from './user';
import { getProject } from './projects';

export interface LogResponse {
    timestamp: string;
    message: string;
}

// Cache for user and project names to avoid repeated API calls
const nameCache = new Map<string, string>();

// UUID regex pattern
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

async function replaceUUIDsWithNames(message: string): Promise<string> {
    const uuids = message.match(UUID_REGEX);
    if (!uuids) return message;

    let processedMessage = message;

    for (const uuid of uuids) {
        // Skip if already processed or cached
        if (nameCache.has(uuid)) {
            const cachedName = nameCache.get(uuid)!;
            processedMessage = processedMessage.replace(new RegExp(uuid, 'g'), cachedName);
            continue;
        }

        try {
            // Try to fetch as user first
            const user = await getUser(uuid);
            const userName = `: ${user.login}`;
            nameCache.set(uuid, userName);
            processedMessage = processedMessage.replace(new RegExp(uuid, 'g'), userName);
        } catch (userError) {
            try {
                // If user fetch fails, try as project
                const project = await getProject(uuid);
                const projectName = `: "${project.name}"`;
                nameCache.set(uuid, projectName);
                processedMessage = processedMessage.replace(new RegExp(uuid, 'g'), projectName);
            } catch (projectError) {
                // If both fail, keep the UUID but mark it as unknown in cache
                nameCache.set(uuid, uuid);
            }
        }
    }

    return processedMessage;
}

export async function getLogs(): Promise<LogResponse[]> {
    try {
        const result = await request('/logs');

        let logs: LogResponse[];

        // If result is a Blob, convert it to text and then parse as JSON
        if (result instanceof Blob) {
            const text = await result.text();
            try {
                logs = JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse Blob content as JSON:', parseError);
                throw new Error(`Received non-JSON response: ${text.substring(0, 200)}...`);
            }
        } else {
            logs = result as LogResponse[];
        }

        // Process each log message to replace UUIDs with names
        const processedLogs = await Promise.all(
            logs.map(async (log) => ({
                ...log,
                message: await replaceUUIDsWithNames(log.message),
            }))
        );

        // Filter out logs that start with HTTP methods
        const filteredLogs = processedLogs.filter((log) => {
            const message = log.message.trim();
            const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
            return !httpMethods.some((method) => message.startsWith(method + ' '));
        });

        return filteredLogs;
    } catch (error) {
        console.error('getLogs error:', error);
        throw error;
    }
}
