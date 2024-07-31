export default class OneLoadingManage {
  private loadingCount = 0
  private openLoading: () => void = () => {}
  private closeLoading: () => void = () => {}
  private closeDelayTimer = -1
  private closeDelay = 360

  private openOnce = true
  private loadingStatus = false

  constructor({
    openLoading,
    closeLoading,
    openOnce = true,
  }: {
    openLoading: OneLoadingManage['openLoading']
    closeLoading: OneLoadingManage['closeLoading']
    openOnce: boolean
  }) {
    this.openOnce = openOnce
    this.openLoading = openLoading
    this.closeLoading = closeLoading
  }

  private checkStatus(status: boolean) {
    if (this.openOnce) {
      if (status === this.loadingStatus) return
      this.loadingStatus = status
    }

    if (status) return this.openLoading()

    clearTimeout(this.closeDelayTimer)
    this.closeDelayTimer = setTimeout(() => {
      this.closeLoading()
    }, this.closeDelay)
  }

  public check() {
    this.checkStatus(this.loadingCount > 0)
  }

  public open() {
    this.loadingCount = this.loadingCount >= 0 ? this.loadingCount + 1 : 1
    this.check()
  }

  public close() {
    this.loadingCount = this.loadingCount <= 0 ? this.loadingCount : this.loadingCount - 1
    this.check()
  }

  public clear() {
    this.loadingCount = 0
    this.check()
  }
}
