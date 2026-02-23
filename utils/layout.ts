import {
  AppSettings,
  PANEL_KEYS,
  PanelKey,
} from "@/context/SettingsContext"

type VisibilitySettings = Pick<AppSettings, "panelOrder" | "panelVisibility">
type LayoutSettings = Pick<AppSettings, "layoutPreset" | "customLayout"> &
  VisibilitySettings

export interface LayoutPreviewModel {
  columns: 1 | 2 | 3
  visiblePanels: PanelKey[]
  featuredPanel: PanelKey | null
}

export function getVisiblePanels(settings: VisibilitySettings): PanelKey[] {
  const visiblePanels = settings.panelOrder.filter(
    (panel) => settings.panelVisibility[panel],
  )

  return visiblePanels.length > 0 ? visiblePanels : [PANEL_KEYS[0]]
}

export function getOrderedVisiblePanels(
  settings: Pick<
    AppSettings,
    "layoutPreset" | "customLayout" | "panelOrder" | "panelVisibility"
  >,
): PanelKey[] {
  const visiblePanels = getVisiblePanels(settings)
  const featuredPanel = getFeaturedPanel(settings, visiblePanels)

  if (!featuredPanel) return visiblePanels

  const rest = visiblePanels.filter((panel) => panel !== featuredPanel)

  if (settings.layoutPreset === "focusLeft") {
    return [featuredPanel, ...rest]
  }

  if (settings.layoutPreset === "focusRight") {
    return [...rest, featuredPanel]
  }

  return visiblePanels
}

export function getDesktopGridClass(
  settings: Pick<AppSettings, "layoutPreset" | "customLayout">,
  visiblePanels: PanelKey[],
): string {
  if (visiblePanels.length <= 1) {
    return "md:grid-cols-1 md:grid-rows-1 md:auto-rows-[minmax(0,1fr)]"
  }

  switch (settings.layoutPreset) {
    case "singleColumn":
      return "md:grid-cols-1 md:auto-rows-[minmax(0,1fr)]"
    case "quad":
      return "md:grid-cols-2 md:grid-rows-2 md:auto-rows-[minmax(0,1fr)]"
    case "focusLeft":
    case "focusRight":
      return "md:grid-cols-3 md:auto-rows-[minmax(0,1fr)]"
    case "custom":
      if (settings.customLayout.columns === 1) {
        return "md:grid-cols-1 md:auto-rows-[minmax(0,1fr)]"
      }
      if (settings.customLayout.columns === 2) {
        return "md:grid-cols-2 md:auto-rows-[minmax(0,1fr)]"
      }
      return "md:grid-cols-3 md:auto-rows-[minmax(0,1fr)]"
    default:
      return "md:grid-cols-2 md:grid-rows-2 md:auto-rows-[minmax(0,1fr)]"
  }
}

export function getFeaturedPanel(
  settings: Pick<AppSettings, "layoutPreset" | "customLayout">,
  visiblePanels: PanelKey[],
): PanelKey | null {
  if (visiblePanels.length <= 1) return null

  const configuredFocusPanel =
    settings.customLayout.focusPanel &&
    visiblePanels.includes(settings.customLayout.focusPanel)
      ? settings.customLayout.focusPanel
      : null

  switch (settings.layoutPreset) {
    case "focusLeft":
      return configuredFocusPanel ?? visiblePanels[0]
    case "focusRight":
      return configuredFocusPanel ?? visiblePanels[visiblePanels.length - 1]
    case "custom":
      if (settings.customLayout.columns <= 1) return null
      return configuredFocusPanel
    default:
      return null
  }
}

export function getPreviewModel(settings: LayoutSettings): LayoutPreviewModel {
  const visiblePanels = getOrderedVisiblePanels(settings)
  const featuredPanel = getFeaturedPanel(settings, visiblePanels)

  let columns: 1 | 2 | 3 = 1
  if (visiblePanels.length > 1) {
    if (settings.layoutPreset === "custom") {
      columns = settings.customLayout.columns
    } else if (settings.layoutPreset === "singleColumn") {
      columns = 1
    } else if (settings.layoutPreset === "quad") {
      columns = 2
    } else {
      columns = 3
    }
  }

  return {
    columns,
    visiblePanels,
    featuredPanel,
  }
}
