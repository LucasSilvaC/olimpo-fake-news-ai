import { describe, expect, it } from "vitest";

import { MockAIAnalysisService } from "../repositories/mock-ai-analysis.service";

describe("MockAIAnalysisService", () => {
  const service = new MockAIAnalysisService();

  describe("Classification from targetClassification", () => {
    it("respects explicit targetClassification 'reliable'", async () => {
      const result = await service.analyze({
        title: "Governo lança novo programa habitacional",
        content: "O ministério anunciou hoje os detalhes do programa de habitação.",
        targetClassification: "reliable",
      });

      expect(result.classification).toBe("reliable");
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
      expect(result.reasons.length).toBeLessThanOrEqual(4);
      expect(result.modelVersion).toBe("mock-v1");
      expect(result.reasons[0]).toMatch(/fonte|institucional|factual|verific|autoridade/i);
    });

    it("respects explicit targetClassification 'unreliable'", async () => {
      const result = await service.analyze({
        title: "Cura milagrosa para todas as doenças é escondida pelos médicos",
        content: "Médicos não querem que você saiba sobre esta erva secreta.",
        targetClassification: "unreliable",
      });

      expect(result.classification).toBe("unreliable");
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
      expect(result.modelVersion).toBe("mock-v1");
      expect(result.reasons[0]).toMatch(/sensacionalis|alarmis|fonte|conspir|desinforma/i);
    });

    it("respects explicit targetClassification 'uncertain'", async () => {
      const result = await service.analyze({
        title: "Relatos preliminares indicam novo asteroide próximo",
        content: "Observadores relatam passagem de objeto celeste ainda não catalogado.",
        targetClassification: "uncertain",
      });

      expect(result.classification).toBe("uncertain");
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeLessThanOrEqual(0.75);
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
      expect(result.modelVersion).toBe("mock-v1");
    });
  });

  describe("Inferred classification when targetClassification is absent", () => {
    it("detects sensationalist indicators as 'unreliable'", async () => {
      const result = await service.analyze({
        title: "URGENTE: Segredo revelado sobre fraude mundial que ninguém pode saber!",
        content: "Conspiração chocante descoberta por ativistas revela cura milagrosa escondida.",
      });

      expect(result.classification).toBe("unreliable");
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    });

    it("detects institutional and scientific indicators as 'reliable'", async () => {
      const result = await service.analyze({
        title: "Estudo publicado na universidade demonstra eficácia de novo tratamento",
        content:
          "Pesquisa científica realizada com dados oficiais e metodologia revisada por pares.",
      });

      expect(result.classification).toBe("reliable");
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    });

    it("defaults ambiguous content to 'uncertain'", async () => {
      const result = await service.analyze({
        title: "Alguns moradores comentam sobre evento na praça central",
        content: "Testemunhas contam versões diferentes do que aconteceu durante a tarde.",
      });

      expect(result.classification).toBe("uncertain");
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Deterministic behavior", () => {
    it("produces identical results for the same input", async () => {
      const input = {
        title: "Notícia de teste para determinismo",
        content: "Conteúdo descritivo sem gatilhos fortes.",
        targetClassification: "reliable" as const,
      };

      const result1 = await service.analyze(input);
      const result2 = await service.analyze(input);

      expect(result1).toEqual(result2);
    });
  });
});
