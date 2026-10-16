import { describe, it, expect } from "vitest";
import {
    buildTaskToken,
    buildUserToken,
    buildAllToken,
    parseChatTokens,
    stripChatTokens,
    parseSafeChatDate,
    formatChatTime
} from "../chatTokenHelper";

describe("chatTokenHelper", () => {
    it("builds user token properly", () => {
        expect(buildUserToken("123", "Duc")).toBe("@{123:Duc}");
    });

    it("builds all token properly", () => {
        expect(buildAllToken()).toBe("@{all:Tất cả mọi người}");
        expect(buildAllToken("Mọi người")).toBe("@{all:Mọi người}");
    });

    it("builds task token properly", () => {
        expect(buildTaskToken("task-456", "TSK-01")).toBe("#{task-456:TSK-01}");
    });

    it("parses tokens correctly including @all", () => {
        const text = "Xin chào @{all:Tất cả mọi người} và xem task #{t1:ERP-01}";
        const tokens = parseChatTokens(text);
        expect(tokens).toEqual([
            { type: "text", content: "Xin chào " },
            { type: "all", id: "all", display: "Tất cả mọi người" },
            { type: "text", content: " và xem task " },
            { type: "task", id: "t1", display: "ERP-01" }
        ]);
    });

    it("strips tokens to readable plain string", () => {
        const text = "Chào @{u1:Đức} và @{all:Tất cả mọi người}";
        expect(stripChatTokens(text)).toBe("Chào @Đức và @Tất cả mọi người");
    });

    it("parses ISO date strings with and without timezone marker", () => {
        expect(parseSafeChatDate(null)).toBeNull();
        expect(parseSafeChatDate("")).toBeNull();

        // ISO with Z
        const dWithZ = parseSafeChatDate("2026-10-16T08:26:00.000Z");
        expect(dWithZ).toBeInstanceOf(Date);
        expect(dWithZ.getTime()).not.toBeNaN();

        // ISO without Z (should append Z so treated as UTC)
        const dWithoutZ = parseSafeChatDate("2026-10-16 08:26:00");
        expect(dWithoutZ).toBeInstanceOf(Date);
        expect(dWithoutZ.getTime()).not.toBeNaN();
        expect(dWithoutZ.toISOString()).toBe("2026-10-16T08:26:00.000Z");
    });

    it("formats chat time to two digits hour and minute", () => {
        expect(formatChatTime(null)).toBe("");
        expect(formatChatTime("invalid-date")).toBe("");

        // Specific UTC timestamp
        const timeStr = formatChatTime("2026-10-16T08:26:00.000Z");
        expect(typeof timeStr).toBe("string");
        expect(timeStr.length).toBeGreaterThanOrEqual(4);
        expect(timeStr).toMatch(/\d{2}:\d{2}/);
    });
});

