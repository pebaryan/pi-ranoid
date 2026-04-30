export interface ExtensionUIDialogOptions {
	signal?: AbortSignal;
	timeout?: number;
}

export interface ExtensionUIContext {
	select(title: string, options: string[], opts?: ExtensionUIDialogOptions): Promise<string | undefined>;
	confirm(title: string, message: string, opts?: ExtensionUIDialogOptions): Promise<boolean>;
	input(title: string, placeholder?: string, opts?: ExtensionUIDialogOptions): Promise<string | undefined>;
	notify(message: string, type?: "info" | "warning" | "error"): void;
	editor(title: string, prefill?: string): Promise<string | undefined>;
}

export interface ExtensionContext {
	ui: ExtensionUIContext;
	hasUI: boolean;
	cwd: string;
	signal: AbortSignal | undefined;
}

export interface ToolCallEvent {
	type: "tool_call";
	toolCallId: string;
	toolName: string;
	input: Record<string, unknown>;
}

export interface ToolCallEventResult {
	block?: boolean;
	reason?: string;
}

export interface ExtensionAPI {
	on(
		event: "tool_call",
		handler: (
			event: ToolCallEvent,
			ctx: ExtensionContext,
		) => Promise<ToolCallEventResult | undefined> | ToolCallEventResult | undefined | void,
	): void;
	registerFlag(
		name: string,
		options: { description?: string; type: "boolean" | "string"; default?: boolean | string },
	): void;
	getFlag(name: string): boolean | string | undefined;
}

export type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;