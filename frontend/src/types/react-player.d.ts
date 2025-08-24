declare module "react-player" {
  import * as React from "react";

  export interface ReactPlayerConfig {
    file?: {
      attributes?: Record<string, any>;
      tracks?: Array<{
        kind: string;
        src: string;
        srcLang?: string;
        default?: boolean;
        label?: string;
      }>;
    };
    youtube?: Record<string, any>;
    vimeo?: Record<string, any>;
    [key: string]: any;
  }

  export interface OnProgressProps {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }

  export interface ReactPlayerProps {
    url?: string | string[];
    playing?: boolean;
    loop?: boolean;
    controls?: boolean;
    volume?: number;
    muted?: boolean;
    playbackRate?: number;
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
    progressInterval?: number;
    playsinline?: boolean;
    config?: ReactPlayerConfig;
    pip?: boolean;
    stopOnUnmount?: boolean;
    light?: boolean | string;
    playIcon?: React.ReactElement;
    previewTabIndex?: number;
    fallback?: React.ReactElement;
    wrapper?: React.ComponentType<any>;

    // Event handlers
    onReady?: () => void;
    onStart?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onBuffer?: () => void;
    onBufferEnd?: () => void;
    onEnded?: () => void;
    onError?: (error: any) => void;
    onDuration?: (duration: number) => void;
    onSeek?: (seconds: number) => void;
    onProgress?: (state: OnProgressProps) => void;
    onClickPreview?: (event: React.MouseEvent) => void;
    onEnablePIP?: () => void;
    onDisablePIP?: () => void;
  }

  export default class ReactPlayer extends React.Component<ReactPlayerProps> {
    static canPlay(url: string): boolean;
    static canEnablePIP(url: string): boolean;
    static addCustomPlayer(player: any): void;
    static removeCustomPlayers(): void;
    
    seekTo(amount: number, type?: "seconds" | "fraction"): void;
    getCurrentTime(): number;
    getSecondsLoaded(): number;
    getDuration(): number;
    getInternalPlayer(key?: string): any;
    showPreview(): void;
  }
}