export type DocumentationGroupId = "produto" | "engenharia" | "manutencao";

export type DocumentationIconName =
  | "Accessibility"
  | "BookOpen"
  | "Compass"
  | "Database"
  | "Files"
  | "Gamepad2"
  | "GitBranch"
  | "Newspaper"
  | "RadioTower"
  | "ShieldCheck"
  | "Terminal"
  | "Trophy"
  | "UsersRound"
  | "Workflow"
  | "Wrench";

export interface DocumentationNavigationGroup {
  id: DocumentationGroupId;
  title: string;
  description: string;
  icon: DocumentationIconName;
}

export type DocumentationBlock =
  | { type: "journey"; journey: DocumentationJourney }
  | { type: "paragraph"; text: string }
  | { type: "callout"; title: string; text: string; tone?: "info" | "warning" }
  | {
      type: "cards";
      items: Array<{ icon: DocumentationIconName; title: string; description: string }>;
    }
  | { type: "steps"; items: Array<{ title: string; description: string }> }
  | {
      type: "figure";
      src: string;
      alt: string;
      caption: string;
      credit?: string;
      creditHref?: string;
    }
  | { type: "code"; label: string; language: string; code: string }
  | {
      type: "table";
      headers: string[];
      rows: Array<string[]>;
    }
  | {
      type: "references";
      items: Array<{ label: string; href: string; description?: string }>;
    };

export interface DocumentationJourney {
  labels: {
    title: string; subtitle: string; present: string; close: string;
    previous: string; next: string; navigation: string; keyboard: string;
    user: string; system: string; fp: string; svm: string;
    active: string; inactive: string; screen: string; takeaway: string;
    step: string; of: string;
  };
  stages: Array<{
    id: string; title: string; subtitle: string; icon: DocumentationIconName;
    user: string; system: string; fp: string; svm: string;
    fpActive: boolean; svmActive: boolean; takeaway: string;
    screen: { badge: string; title: string; lines: string[]; choices?: string[]; note: string };
  }>;
}

export interface DocumentationSection {
  id: string;
  title: string;
  blocks: DocumentationBlock[];
}

export interface IDocumentationPage {
  slug: string;
  href: string;
  title: string;
  summary: string;
  category: string;
  group: DocumentationGroupId;
  icon: DocumentationIconName;
  readingTime: string;
  sections: DocumentationSection[];
}

export interface IDocumentationRepository {
  list(): IDocumentationPage[];
  findBySlug(slug: string): IDocumentationPage | undefined;
}
