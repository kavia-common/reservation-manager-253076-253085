import { useMemo } from "react";

/**
 * Feature flags hook
 * Reads environment-driven flags and exposes them as stable, memoized values.
 * - REACT_APP_FEATURE_FLAGS: comma-separated list of enabled flags
 * - REACT_APP_EXPERIMENTS_ENABLED: "true"/"false" (string) to enable experiments
 */

// PUBLIC_INTERFACE
export function useFeatureFlags() {
  /**
   * Returns a stable object of feature flags derived from environment.
   * The result contains:
   * - rawFlags: Set<string> with individual flags
   * - isEnabled(flag: string): boolean helper
   * - experimentsEnabled: boolean flag from REACT_APP_EXPERIMENTS_ENABLED
   * - all: string[] list of all parsed flags (sorted)
   */
  const result = useMemo(() => {
    const raw = (process.env.REACT_APP_FEATURE_FLAGS || "").trim();
    const experiments =
      (process.env.REACT_APP_EXPERIMENTS_ENABLED || "false").toLowerCase() ===
      "true";

    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Normalize to lowercase keys for robustness
    const normalized = parts.map((p) => p.toLowerCase());
    const set = new Set(normalized);

    const api = {
      rawFlags: set,
      experimentsEnabled: experiments,
      all: [...set].sort(),
      // PUBLIC_INTERFACE
      isEnabled(flag) {
        /** Check if a given feature flag is enabled (case-insensitive). */
        if (!flag) return false;
        return set.has(String(flag).toLowerCase());
      },
    };
    return api;
  }, []);

  return result;
}

export default useFeatureFlags;
