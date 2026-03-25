// ---------------------------------------------------------------------------
// @gamiforge/sdk/react — React Integration Layer
// ---------------------------------------------------------------------------

// Provider
export { GamiforgeProvider } from './GamiforgeProvider.js';
export type { GamiforgeProviderProps } from './GamiforgeProvider.js';

// Hooks
export { useGamiforgeClient } from './hooks/useGamiforgeClient.js';
export { useUserState } from './hooks/useUserState.js';
export type { UseUserStateReturn } from './hooks/useUserState.js';
export { useTrackEvent } from './hooks/useTrackEvent.js';
export type { UseTrackEventReturn } from './hooks/useTrackEvent.js';
export { useAchievementFeed } from './hooks/useAchievementFeed.js';
export type { AchievementFeedItem, AchievementImportance, UseAchievementFeedReturn } from './hooks/useAchievementFeed.js';
export { useXPProgress } from './hooks/useXPProgress.js';
export type { UseXPProgressReturn } from './hooks/useXPProgress.js';
export { useLeaderboard } from './hooks/useLeaderboard.js';
export type { UseLeaderboardOptions, UseLeaderboardReturn } from './hooks/useLeaderboard.js';
export { useAwardFeed } from './hooks/useAwardFeed.js';
export type { AwardFeedItem, UseAwardFeedReturn } from './hooks/useAwardFeed.js';

// Components
export { ProgressBar } from './components/ProgressBar.js';
export type { ProgressBarProps } from './components/ProgressBar.js';
export { AchievementToast } from './components/AchievementToast.js';
export type { AchievementToastProps } from './components/AchievementToast.js';
export { AchievementModal } from './components/AchievementModal.js';
export type { AchievementModalProps, AchievementModalConfig } from './components/AchievementModal.js';
export { ConfettiBurst } from './components/Confetti.js';
export type { ConfettiBurstProps } from './components/Confetti.js';
export { XPGainIndicator } from './components/XPGainIndicator.js';
export type { XPGainIndicatorProps } from './components/XPGainIndicator.js';
export { LevelUpModal } from './components/LevelUpModal.js';
export type { LevelUpModalProps } from './components/LevelUpModal.js';
export { StreakIndicator } from './components/StreakIndicator.js';
export type { StreakIndicatorProps } from './components/StreakIndicator.js';
export { Leaderboard } from './components/Leaderboard.js';
export type { LeaderboardProps } from './components/Leaderboard.js';
export { UserProgressWidget } from './components/UserProgressWidget.js';
export type { UserProgressWidgetProps } from './components/UserProgressWidget.js';
export { AwardToast } from './components/AwardToast.js';
export type { AwardToastProps } from './components/AwardToast.js';

// Theme
export type { GamiforgeTheme, GamiforgeThemeColors } from './theme/types.js';
