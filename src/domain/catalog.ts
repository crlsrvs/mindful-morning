import type {
  Manifest,
  Question,
  Reflection,
  ReflectionFamily,
} from "../../content/content-contract";
export interface Catalog {
  manifest: Manifest;
  questions: readonly Question[];
  reflections: readonly Reflection[];
  families: readonly ReflectionFamily[];
}
