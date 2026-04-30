import type { ExtensionFactory, ExtensionAPI, ExtensionContext, ToolCallEvent, ToolCallEventResult } from "./pi-api.js";

const ALLOW = "Allow";
const EDIT = "Edit args";
const BLOCK = "Block";

function formatArgs(input: Record<string, unknown>): string {
	return JSON.stringify(input, null, 2);
}

const extension: ExtensionFactory = (pi: ExtensionAPI) => {
	pi.registerFlag("intercept-allow-all", {
		type: "boolean",
		description: "Auto-approve all tool calls without prompting",
		default: false,
	});

	pi.registerFlag("intercept-auto-allow", {
		type: "string",
		description: "Comma-separated tool names to auto-approve (e.g. 'read,ls,grep')",
		default: "",
	});

	pi.on("tool_call", async (event: ToolCallEvent, ctx: ExtensionContext): Promise<ToolCallEventResult | undefined> => {
		if (!ctx.hasUI) {
			return undefined;
		}

		const allowAll = pi.getFlag("intercept-allow-all") as boolean;
		if (allowAll) {
			return undefined;
		}

		const autoAllowStr = pi.getFlag("intercept-auto-allow") as string;
		const autoAllowTools = autoAllowStr
			? autoAllowStr.split(",").map((t: string) => t.trim()).filter(Boolean)
			: [];
		if (autoAllowTools.includes(event.toolName)) {
			return undefined;
		}

		if (ctx.signal?.aborted) {
			return undefined;
		}

		ctx.ui.notify(`Intercepted: ${event.toolName}`, "info");

		while (true) {
			const choice = await ctx.ui.select(
				`Intercept: ${event.toolName}`,
				[ALLOW, EDIT, BLOCK],
				{ signal: ctx.signal },
			);

			if (ctx.signal?.aborted) {
				return undefined;
			}

			if (!choice || choice === ALLOW) {
				return undefined;
			}

			if (choice === BLOCK) {
				const reason = await ctx.ui.input(
					`Block reason for ${event.toolName}`,
					"Blocked by user",
					{ signal: ctx.signal },
				);
				return {
					block: true,
					reason: reason || `Tool ${event.toolName} blocked by user`,
				};
			}

			if (choice === EDIT) {
				const currentJson = formatArgs(event.input as Record<string, unknown>);
				const edited = await ctx.ui.editor(
					`Edit args: ${event.toolName}`,
					currentJson,
				);

				if (edited === undefined) {
					continue;
				}

				try {
					const parsed = JSON.parse(edited);
					if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
						const input = event.input as Record<string, unknown>;
						const keysToRemove = Object.keys(input).filter((k) => !(k in parsed));
						for (const key of keysToRemove) {
							delete input[key];
						}
						for (const [key, value] of Object.entries(parsed)) {
							input[key] = value;
						}
						return undefined;
					} else {
						ctx.ui.notify("Args must be a JSON object. Try again or choose a different action.", "error");
						continue;
					}
				} catch {
					ctx.ui.notify("Invalid JSON. Fix the syntax or choose a different action.", "error");
					continue;
				}
			}
		}
	});
};

export default extension;