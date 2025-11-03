import { z } from 'zod';
export { z } from 'zod';

type Provider = {
    apiKey: string;
    baseURL: string;
    model: string;
    headers?: Record<string, string>;
};
type ToolSchema = {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties?: Record<string, any>;
            required?: string[];
            additionalProperties: boolean;
        };
    };
};
type Tool = {
    schema: ToolSchema;
    execute: (args: any) => any;
};
type ContentPart = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: {
        url: string;
    };
};
type ContentOptions = string | null | ContentPart[];
type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
interface Message {
    id?: string;
    role: MessageRole;
    content: ContentOptions;
    name?: string;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}
type ToolCall = {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
};
type ToolChoice = 'auto' | 'none' | 'required' | {
    type: 'function';
    function: {
        name: string;
    };
};
type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high';
type ReasoningOptions = {
    enabled?: boolean;
    effort?: ReasoningLevel;
};
type TokenUsage = {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
};
type Metadata = {
    id: string;
    prompt: string;
    providerName: string;
    model: string;
    tokensUsed?: TokenUsage;
    timing: {
        latencyMs: number;
        latencySeconds: number;
    };
    timestamp: string;
    context: Record<string, any>;
    isReasoningEnabled?: boolean | ReasoningLevel;
    isReasoningModel?: boolean;
    reasoning_effort?: ReasoningLevel;
    hasThoughts?: boolean;
};
type ErrorPayloadType = 'timeout' | 'api_error';
type ErrorPayload = {
    type: ErrorPayloadType;
    message: string;
    status?: number;
    code?: string;
    details?: any;
};
type Response = {
    metadata: Metadata;
    completion: {
        role: string;
        content: string;
        reasoning?: string;
        original: string;
    };
    error?: ErrorPayload;
    fullResponse?: Record<string, unknown>;
};
type StreamChunk = {
    delta: string;
    fullContent: string;
    reasoning?: string;
    done: boolean;
    metadata?: Metadata;
    completion?: {
        role: string;
        content: string;
        reasoning?: string;
        original: string;
    };
};
type StreamResponse = AsyncGenerator<StreamChunk, void, unknown>;
type ToolResponse = {
    toolName: string;
    arguments: string;
    result: string | null;
    error?: string;
};
type OnCompleteResponse = (result: Response, messages?: Message[]) => void;
type OnMessageResponse = (messages: Message[]) => void;
type OnRequestData = (request: any) => void;
type OnResponseData = (response: any) => void;
type OnErrorResponse = (error: any) => void;
type OnToolCall = (toolResponse: ToolResponse) => void;
type LlmParams = {
    model?: string;
    messages?: Message[];
    tool_choice?: ToolChoice;
    temperature?: number;
    max_tokens?: number;
    max_completion_tokens?: number;
    stream?: boolean;
    top_p?: number;
    top_k?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
};
type MicroOptions = {
    provider?: Provider;
    systemPrompt?: string;
    prompt?: string;
    context?: Record<string, any>;
    maxTokens?: number;
    tools?: Tool[];
    reasoning?: boolean;
    reasoning_effort?: ReasoningLevel;
    timeout?: number;
    debug?: boolean;
    override?: LlmParams & Record<string, any>;
    onComplete?: OnCompleteResponse;
    onMessage?: OnMessageResponse;
    onRequest?: OnRequestData;
    onResponseData?: OnResponseData;
    onError?: OnErrorResponse;
    onToolCall?: OnToolCall;
} & LlmParams;

declare class Micro {
    private readonly identifier;
    private readonly baseURL;
    private readonly headers;
    private readonly model;
    private readonly modelName;
    private readonly providerName;
    private readonly defaultProvider;
    private readonly capabilities;
    private readonly debug;
    private readonly streamEnabled;
    private readonly timeout?;
    private systemPrompt;
    private parsedSystemPrompt;
    private messages;
    private context;
    private prompt;
    private maxTokens?;
    private temperature?;
    private tools?;
    private tool_choice?;
    private reasoning;
    private reasoning_effort?;
    private override?;
    private onComplete?;
    private onMessage?;
    private onRequest?;
    private onResponseData?;
    private onError?;
    private onToolCall?;
    constructor(options?: MicroOptions);
    private initializeProvider;
    private buildHeaders;
    private detectModelCapabilities;
    private logDebugInfo;
    getMetadata(): Metadata;
    getSystemPrompt(): string;
    setSystemPrompt(prompt: string): void;
    private getSystemMessage;
    private getNonSystemMessages;
    flushAllMessages(): void;
    limitMessages(limit?: number): Message[];
    getMessages(): Message[];
    setMessages(messages: Message[]): void;
    setUserMessage(prompt: string, bufferString?: string): void;
    setAssistantMessage(prompt: string): this;
    private buildRequestBody;
    private applyReasoningConfig;
    private makeRequest;
    private executeTool;
    private handleToolCalls;
    private extractReasoning;
    private buildResponse;
    private buildErrorResponse;
    invoke(): Promise<Response>;
    chat(prompt: string, bufferString?: string): Promise<Response>;
    private buildStreamMetadata;
    private processStream;
    stream(prompt: string, bufferString?: string): Promise<StreamResponse>;
}

type AgentOptions = Omit<MicroOptions, 'prompt'> & {
    name: string;
    background: string;
    goal?: string;
    position?: string;
    additionalInstructions?: string;
    handoffs?: Agent[];
};
declare class Agent {
    private client;
    name: string;
    background: string;
    goal: string | undefined;
    position: string | undefined;
    handoffs?: Agent[];
    tools?: Tool[];
    model: string | undefined;
    constructor(options: AgentOptions);
    private buildSystemPrompt;
    private handoffAgentToTools;
    private toolsToStringList;
    private handoffAgentToStringList;
    invoke(): Promise<Response>;
    chat(prompt: string): Promise<Response>;
    getMessages(): Message[];
    addPrompt(msg: string): void;
    addAssistantPrompt(msg: string): void;
    getMetadata(): Metadata;
    static create(options: AgentOptions): Agent;
}
declare class Orchestrator extends Agent {
    constructor(options: AgentOptions);
    static create(options: AgentOptions): Orchestrator;
}

/**
 * Creates a tool that can be used by agents to perform specific actions.
 *
 * @param name - The name of the tool
 * @param description - A description of what the tool does
 * @param schema - A trod schema defining the tool's parameters
 * @param executeFn - The function to execute when the tool is called
 * @returns A Tool object with schema and execute function
 *
 * @example
 * ```typescript
 * const weatherTool = createTool(
 *   "get_weather",
 *   "Get the current weather for a location",
 *   z.object({
 *     location: z.string().describe("The city and state, e.g. San Francisco, CA"),
 *     unit: z.enum(["celsius", "fahrenheit"]).optional()
 *   }),
 *   async (params) => {
 *     return `Weather in ${params.location}: 72°F, sunny`;
 *   }
 * );
 * ```
 */
declare function createTool<T extends z.ZodTypeAny, R>(name: string, description: string, schema: T, executeFn: (params: z.infer<T>) => Promise<R> | R): Tool;

/**
 * Create a provider configuration object
 * Separates the model from the provider config for internal use
 */
declare function createProvider(config: Provider): {
    provider: Omit<Provider, 'model'>;
    model: string;
};
/**
 * Built-in provider configurations
 * Each provider includes API endpoint, authentication, and default model
 */
declare const Providers: {
    openai: (model?: string) => Provider;
    groq: (model?: string) => Provider;
    gemini: (model?: string) => Provider;
    ai302: (model?: string) => Provider;
    openrouter: (model?: string) => Provider;
    deepseek: (model?: string) => Provider;
    grok: (model?: string) => Provider;
    fireworks: (model?: string) => Provider;
    mistral: (model?: string) => Provider;
    together: (model?: string) => Provider;
};

type HttpMethod = 'get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH';
interface HttpClientOptions {
    baseURL: string;
    endpoint: string;
    headers: Record<string, string>;
    body?: Record<string, any>;
    timeout?: number;
    method?: HttpMethod;
    stream?: boolean;
}
interface HttpError extends Error {
    response?: {
        status: number;
        data: any;
    };
    code?: string;
}
declare function httpClient<T = any>(options: HttpClientOptions): Promise<T>;
declare function get<T = any>(options: Omit<HttpClientOptions, 'body' | 'method'>): Promise<T>;
declare function post<T = any>(options: HttpClientOptions): Promise<T>;
declare function put<T = any>(options: HttpClientOptions): Promise<T>;
declare function patch<T = any>(options: HttpClientOptions): Promise<T>;
declare function del<T = any>(options: Omit<HttpClientOptions, 'body' | 'method'>): Promise<T>;
declare function head<T = any>(options: Omit<HttpClientOptions, 'body' | 'method'>): Promise<T>;
declare function options<T = any>(options: Omit<HttpClientOptions, 'body' | 'method'>): Promise<T>;

type http_HttpClientOptions = HttpClientOptions;
type http_HttpError = HttpError;
type http_HttpMethod = HttpMethod;
declare const http_del: typeof del;
declare const http_get: typeof get;
declare const http_head: typeof head;
declare const http_httpClient: typeof httpClient;
declare const http_options: typeof options;
declare const http_patch: typeof patch;
declare const http_post: typeof post;
declare const http_put: typeof put;
declare namespace http {
  export { type http_HttpClientOptions as HttpClientOptions, type http_HttpError as HttpError, type http_HttpMethod as HttpMethod, http_del as del, http_get as get, http_head as head, http_httpClient as httpClient, http_options as options, http_patch as patch, http_post as post, http_put as put };
}

/**
 * Generate a random ID using crypto.randomUUID
 */
declare function randomId(): string;
/**
 * Parse template string and replace {{variable}} placeholders with context values
 * @param template - Template string with {{variable}} placeholders
 * @param context - Object containing variable values
 * @returns Parsed string with variables replaced
 */
declare function parseTemplate(template: string, context?: Record<string, any>): string;
/**
 * Convert a string to a URL-friendly slug
 * @param text - Text to slugify
 * @returns Slugified text (lowercase, hyphens, alphanumeric)
 */
declare function slugify(text: string): string;

export { Agent, type AgentOptions, type ContentOptions, type ContentPart, type ErrorPayload, type HttpClientOptions, type HttpError, type HttpMethod, type Message, type Metadata, Micro, type MicroOptions, type OnCompleteResponse, type OnErrorResponse, type OnMessageResponse, type OnRequestData, type OnResponseData, type OnToolCall, Orchestrator, type Provider, Providers, type ReasoningLevel, type ReasoningOptions, type Response, type StreamChunk, type StreamResponse, type TokenUsage, type Tool, type ToolCall, type ToolChoice, type ToolResponse, createProvider, createTool, del, get, head, http, httpClient, options, parseTemplate, patch, post, put, randomId, slugify };
