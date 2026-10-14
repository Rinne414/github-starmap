import { describe, expect, test } from "vitest";
import { parseGithubInput } from "../src/github/parse";

describe("parseGithubInput", () => {
  test.each([
    ["octocat", "octocat"],
    ["  octocat  ", "octocat"],
    ["@octocat", "octocat"],
    ["github.com/octocat", "octocat"],
    ["https://github.com/octocat", "octocat"],
    ["http://www.github.com/octocat/", "octocat"],
    ["https://github.com/octocat?tab=stars", "octocat"],
    ["https://github.com/octocat/Hello-World", "octocat"],
    ["github.com/orgs/vercel", "vercel"],
    ["octocat/Hello-World", "octocat"],
    ["my-name-1", "my-name-1"],
  ])("%s -> %s", (input, expected) => {
    expect(parseGithubInput(input)).toBe(expected);
  });

  test.each([
    [""],
    ["   "],
    ["@"],
    ["-starts-with-dash"],
    ["ends-with-dash-"],
    ["has space"],
    ["a".repeat(40)],
    ["https://gitlab.com/octocat"],
    ["https://github.com/"],
    ["https://github.com/settings/profile"],
    ["https://github.com/topics/ai"],
    ["名字"],
  ])("rejects %j", (input) => {
    expect(parseGithubInput(input)).toBeNull();
  });
});
