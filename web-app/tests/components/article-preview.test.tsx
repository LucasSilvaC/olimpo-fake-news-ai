import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArticlePreview, type INewsArticle } from "@/entities/news-article";

const mockArticle: INewsArticle = {
  url: "https://example.com/test",
  canonicalUrl: null,
  title: "Notícia de Teste Exemplo",
  description: "Descrição breve da notícia de teste.",
  authors: ["Jornalista Teste", "Co-autor Teste"],
  publishedAt: "2026-09-11T12:00:00Z",
  modifiedAt: null,
  content: "Conteúdo detalhado da notícia de teste.",
  imageUrl: "https://example.com/test.jpg",
  publisher: "Tech Daily",
  language: "pt",
  extractionMethod: "local",
  usedFallback: false,
};

describe("ArticlePreview", () => {
  it("renders all article elements according to accessibility and DOM specifications", () => {
    render(<ArticlePreview article={mockArticle} />);

    expect(screen.getByRole("heading", { level: 2, name: mockArticle.title! })).toBeInTheDocument();
    expect(screen.getByText("Extração local")).toBeInTheDocument();
    expect(screen.getByText("Jornalista Teste, Co-autor Teste")).toBeInTheDocument();
    expect(screen.getByText("Tech Daily")).toBeInTheDocument();
    expect(screen.getByText("Não")).toBeInTheDocument();
    expect(screen.getByText(mockArticle.description!)).toBeInTheDocument();
    expect(screen.getByText(mockArticle.content)).toHaveClass("article-content");

    const imageLink = screen.getByRole("link", { name: mockArticle.imageUrl! });
    expect(imageLink).toHaveAttribute("href", mockArticle.imageUrl);
  });
});
