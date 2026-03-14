// ---------------------------------------------------------------------------
// Gamiforge Theme Type Definitions
// ---------------------------------------------------------------------------

export interface GamiforgeThemeColors {
  primary?: string;
  primaryLight?: string;
  success?: string;
  warning?: string;
  danger?: string;
  text?: string;
  textSecondary?: string;
  background?: string;
  surface?: string;
  border?: string;
}

export interface GamiforgeTheme {
  colors?: GamiforgeThemeColors;
  fontFamily?: string;
  fontSizeSm?: string;
  fontSizeBase?: string;
  fontSizeLg?: string;
  fontSizeXl?: string;
  spacingXs?: string;
  spacingSm?: string;
  spacingMd?: string;
  spacingLg?: string;
  borderRadius?: string;
  shadow?: string;
  transitionDuration?: string;
  animationDuration?: string;
}

/**
 * Map a GamiforgeTheme object to CSS custom property overrides.
 * Only non-undefined values are included.
 */
export function themeToCSSProperties(theme: GamiforgeTheme): Record<string, string> {
  const vars: Record<string, string> = {};

  if (theme.colors) {
    const c = theme.colors;
    if (c.primary) vars['--gf-color-primary'] = c.primary;
    if (c.primaryLight) vars['--gf-color-primary-light'] = c.primaryLight;
    if (c.success) vars['--gf-color-success'] = c.success;
    if (c.warning) vars['--gf-color-warning'] = c.warning;
    if (c.danger) vars['--gf-color-danger'] = c.danger;
    if (c.text) vars['--gf-color-text'] = c.text;
    if (c.textSecondary) vars['--gf-color-text-secondary'] = c.textSecondary;
    if (c.background) vars['--gf-color-background'] = c.background;
    if (c.surface) vars['--gf-color-surface'] = c.surface;
    if (c.border) vars['--gf-color-border'] = c.border;
  }

  if (theme.fontFamily) vars['--gf-font-family'] = theme.fontFamily;
  if (theme.fontSizeSm) vars['--gf-font-size-sm'] = theme.fontSizeSm;
  if (theme.fontSizeBase) vars['--gf-font-size-base'] = theme.fontSizeBase;
  if (theme.fontSizeLg) vars['--gf-font-size-lg'] = theme.fontSizeLg;
  if (theme.fontSizeXl) vars['--gf-font-size-xl'] = theme.fontSizeXl;
  if (theme.spacingXs) vars['--gf-spacing-xs'] = theme.spacingXs;
  if (theme.spacingSm) vars['--gf-spacing-sm'] = theme.spacingSm;
  if (theme.spacingMd) vars['--gf-spacing-md'] = theme.spacingMd;
  if (theme.spacingLg) vars['--gf-spacing-lg'] = theme.spacingLg;
  if (theme.borderRadius) vars['--gf-border-radius'] = theme.borderRadius;
  if (theme.shadow) vars['--gf-shadow'] = theme.shadow;
  if (theme.transitionDuration) vars['--gf-transition-duration'] = theme.transitionDuration;
  if (theme.animationDuration) vars['--gf-animation-duration'] = theme.animationDuration;

  return vars;
}
