import { describe, expect, it } from "vitest";
import request from "supertest";

import { testAccessToken, testApp } from "./setup";

describe("AI Endpoints", () => {
  it("requires authentication", async () => {
    const response = await request(testApp).post("/ai/analyze-invoice").expect(401);

    expect(response.body.message).toContain("Authorization token is required");
  });

  it("validates invoice requests before calling the model", async () => {
    const response = await request(testApp)
      .post("/ai/analyze-invoice")
      .set("Authorization", `Bearer ${testAccessToken}`)
      .send({})
      .expect(400);

    expect(response.body.message).toBe("Validation failed");
  });
});
