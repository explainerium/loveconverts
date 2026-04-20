declare module "potrace" {
  interface TraceOptions {
    turnPolicy?: string;
    turdSize?: number;
    alphaMax?: number;
    optCurve?: boolean;
    optTolerance?: number;
    threshold?: number;
    blackOnWhite?: boolean;
    color?: string;
    background?: string;
  }

  interface PosterizeOptions extends TraceOptions {
    steps?: number | number[];
    fillStrategy?: string;
    rangeDistribution?: string;
  }

  function trace(
    file: string | Buffer,
    options: TraceOptions,
    callback: (err: Error | null, svg: string) => void
  ): void;

  function trace(
    file: string | Buffer,
    callback: (err: Error | null, svg: string) => void
  ): void;

  function posterize(
    file: string | Buffer,
    options: PosterizeOptions,
    callback: (err: Error | null, svg: string) => void
  ): void;

  function posterize(
    file: string | Buffer,
    callback: (err: Error | null, svg: string) => void
  ): void;
}
