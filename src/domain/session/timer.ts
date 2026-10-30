/** Monotonic foreground clock. Neither wall time nor a suspended interval unlocks answers. */
export class ForegroundTimer {
  private last: number | null = null;
  constructor(
    private accumulated: number,
    private readonly limit: number,
  ) {}
  resume(now: number) {
    this.last = now;
  }
  tick(now: number) {
    if (this.last !== null)
      this.accumulated = Math.min(
        this.limit,
        this.accumulated + Math.max(0, now - this.last) / 1000,
      );
    if (this.last !== null) this.last = now;
    return this.accumulated;
  }
  pause(now: number) {
    this.tick(now);
    this.last = null;
    return this.accumulated;
  }
  get seconds() {
    return this.accumulated;
  }
  get checkpoint() {
    return Math.floor(this.accumulated);
  }
  get ready() {
    return this.accumulated >= this.limit;
  }
}
