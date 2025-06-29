import { Directive, DirectiveBinding } from "vue";
import {
  GlobalConfig,
  PermissionsArray,
  PermissionValue,
  PermissionObject,
} from "./types";

let globalConfig: GlobalConfig = { permissions: null };

export const configurePermissionDirective = (
  permissions: PermissionsArray
): void => {
  globalConfig.permissions = permissions;
};

const vPermission: Directive = {
  async mounted(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    const { value } = binding;

    const permissions = globalConfig.permissions;
    const devWarn = (message: string) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[v-permission]: ${message}`, { value, element: el });
      }
    };

    if (!permissions) {
      devWarn(
        "Permissions are not available. Make sure to configure them using configurePermissionDirective()."
      );
      return;
    }

    if (value === "*") return;

    // Validate permission value format
    const validatePermissionFormat = (
      permissionValue: PermissionValue
    ): boolean => {
      if (permissionValue === null || permissionValue === undefined) {
        devWarn("Permission value is null or undefined");
        return false;
      }

      if (typeof permissionValue === "string") return true;

      if (Array.isArray(permissionValue)) {
        const hasInvalidItems = permissionValue.some(
          (item) =>
            typeof item !== "string" &&
            (typeof item !== "object" || !item.permissions || !item.mode)
        );

        if (hasInvalidItems) {
          devWarn(
            "Array contains invalid permission items. Expected string or object with permissions and mode properties"
          );
          return false;
        }
        return true;
      }

      if (typeof permissionValue === "object") {
        if (!permissionValue.permissions || !permissionValue.mode) {
          devWarn('Object must have both "permissions" and "mode" properties');
          return false;
        }

        if (!Array.isArray(permissionValue.permissions)) {
          devWarn("Object permissions property must be an array");
          return false;
        }

        const validModes = [
          "and",
          "or",
          "startWith",
          "endWith",
          "exact",
          "regex",
        ];
        if (!validModes.includes(permissionValue.mode)) {
          devWarn(
            `Invalid mode "${
              permissionValue.mode
            }". Valid modes: ${validModes.join(", ")}`
          );
          return false;
        }

        return true;
      }

      devWarn("Permission value must be a string, array, or object");
      return false;
    };

    if (!validatePermissionFormat(value)) {
      if (el.parentNode) el.parentNode.removeChild(el);
      return;
    }

    // Helper function to get current permissions (handles both reactive and static arrays)
    const getCurrentPermissions = (): string[] => {
      // If permissions is a reactive ref, get its value
      if (
        permissions &&
        typeof permissions === "object" &&
        "value" in permissions
      ) {
        return permissions.value;
      }
      // Otherwise, treat as regular array
      return permissions as string[];
    };

    const checkPermission = async (permission: string): Promise<boolean> => {
      const currentPermissions = getCurrentPermissions();
      return (
        Array.isArray(currentPermissions) &&
        currentPermissions.includes(permission)
      );
    };

    const checkStartsWith = async (
      permissionsToCheck: string[]
    ): Promise<boolean> => {
      const currentPermissions = getCurrentPermissions();
      if (!Array.isArray(currentPermissions)) return false;

      return permissionsToCheck.some((perm) =>
        currentPermissions.some((userPerm) => userPerm.startsWith(perm))
      );
    };

    const checkEndsWith = async (
      permissionsToCheck: string[]
    ): Promise<boolean> => {
      const currentPermissions = getCurrentPermissions();
      if (!Array.isArray(currentPermissions)) return false;

      return permissionsToCheck.some((perm) =>
        currentPermissions.some((userPerm) => userPerm.endsWith(perm))
      );
    };

    const checkExactMatch = async (
      permissionsToCheck: string[]
    ): Promise<boolean> => {
      const currentPermissions = getCurrentPermissions();
      if (!Array.isArray(currentPermissions)) return false;

      return permissionsToCheck.some((perm) =>
        currentPermissions.includes(perm)
      );
    };

    const checkRegexMatch = async (
      permissionsToCheck: string[]
    ): Promise<boolean> => {
      const currentPermissions = getCurrentPermissions();
      if (!Array.isArray(currentPermissions)) return false;

      return permissionsToCheck.some((pattern) => {
        try {
          const regex = new RegExp(pattern);
          return currentPermissions.some((userPerm) => regex.test(userPerm));
        } catch (error) {
          devWarn(
            `Invalid regex pattern: "${pattern}". Error: ${
              (error as Error).message
            }`
          );
          return false;
        }
      });
    };

    const evaluatePermission = async (
      permissionValue: PermissionValue
    ): Promise<boolean> => {
      // Handle object with permissions and mode
      if (
        typeof permissionValue === "object" &&
        !Array.isArray(permissionValue) &&
        permissionValue.permissions &&
        permissionValue.mode
      ) {
        const { permissions: permsToCheck, mode } = permissionValue;

        if (!Array.isArray(permsToCheck)) {
          devWarn("Permissions must be an array");
          return false;
        }
        const hasNonStringPermissions = permsToCheck.some(
          (perm) => typeof perm !== "string"
        );
        if (hasNonStringPermissions) {
          devWarn("All permissions in array must be strings");
          return false;
        }

        let results: boolean[];

        switch (mode) {
          case "startWith":
            return await checkStartsWith(permsToCheck);
          case "endWith":
            return await checkEndsWith(permsToCheck);
          case "exact":
            return await checkExactMatch(permsToCheck);
          case "regex":
            return await checkRegexMatch(permsToCheck);
          case "and":
            results = await Promise.all(permsToCheck.map(checkPermission));
            return results.every(Boolean);
          case "or":
            results = await Promise.all(permsToCheck.map(checkPermission));
            return results.some(Boolean);
          default:
            devWarn(`Unknown mode: ${mode}`);
            return false;
        }
      }

      // Handle array of permissions (default OR mode) or mixed array
      if (Array.isArray(permissionValue)) {
        const results = await Promise.all(
          permissionValue.map(async (item) => {
            if (typeof item === "string") return await checkPermission(item);
            else if (typeof item === "object" && item.permissions && item.mode)
              return await evaluatePermission(item);
            else {
              devWarn(
                `Invalid array item type. Expected string or object with permissions and mode`
              );
              return false;
            }
          })
        );
        return results.some(Boolean);
      }

      // Handle single string permission
      if (typeof permissionValue === "string")
        return await checkPermission(permissionValue);

      devWarn("Unsupported permission value format");
      return false;
    };

    try {
      const hasPermission = await evaluatePermission(value);

      if (!hasPermission && el.parentNode) el.parentNode.removeChild(el);
    } catch (error) {
      devWarn(`Error evaluating permissions: ${(error as Error).message}`);
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  },
};

export default vPermission;
export { vPermission };
