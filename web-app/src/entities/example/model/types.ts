export interface IExampleEntity {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: "draft" | "published" | "archived";
}
