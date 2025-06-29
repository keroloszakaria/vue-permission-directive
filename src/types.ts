import { Ref } from "vue";

export type PermissionMode =
  | "and"
  | "or"
  | "startWith"
  | "endWith"
  | "exact"
  | "regex";

export interface PermissionObject {
  permissions: string[];
  mode: PermissionMode;
}

export type PermissionValue =
  | string
  | string[]
  | PermissionObject
  | (string | PermissionObject)[];

export type PermissionsArray = string[] | Ref<string[]>;

export interface GlobalConfig {
  permissions: PermissionsArray | null;
}
