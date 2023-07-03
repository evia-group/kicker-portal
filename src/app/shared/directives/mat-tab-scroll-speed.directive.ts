import { Directive, HostListener, OnInit, Renderer2 } from '@angular/core';
import { MatTabNav } from '@angular/material/tabs';

@Directive({
  selector: '[appMatTabScrollSpeed]',
})
export class MatTabScrollSpeedDirective implements OnInit {
  private tabListContainer;
  private tabList;
  private tabListMaxScroll: number;
  private currentScroll;
  private previousDeltaX;
  private readonly SCROLL_DURATION = 300;

  constructor(private matTabNav: MatTabNav, private renderer: Renderer2) {}

  ngOnInit(): void {
    const hammer = new Hammer(this.matTabNav._tabListContainer.nativeElement);

    hammer.on('panstart', () => {
      console.log('start');
    });
    this.tabListContainer = this.matTabNav._tabListContainer.nativeElement;
    if (!this.tabListContainer) {
      throw new Error('No TabListContainer found!');
    }
    this.tabList = this.matTabNav._tabList.nativeElement;
    if (!this.tabList) {
      throw new Error('No TabList found!');
    }
    this.setCurrentScroll();
    // this.matTabNavEventsHandler();
  }

  setCurrentScroll() {
    const currentTransform = this.tabList.style.transform;
    if (currentTransform && currentTransform.indexOf('translateX') > -1) {
      let tmp = currentTransform.substring('translateX('.length);
      tmp = tmp.substring(0, tmp.length - 'px'.length);
      this.currentScroll = parseInt(tmp, 10);
    } else {
      this.currentScroll = 0;
    }
  }

  @HostListener('panend', ['$event'])
  onPanEnd(_event: HammerInput) {
    // console.log(event);
    // const velocity = Math.abs(event.velocityX);
    this.setCurrentScroll();
    // console.log(velocity);
    // if (velocity > 10) {
    //   const distance = velocity * this.SCROLL_DURATION;
    //
    //   // const scrollContainer = this.matTabNav.nativeElement.querySelector(
    //   //   '.mat-tab-link-container'
    //   // );
    //   console.log(scrollContainer.scrollLeft);
    //   const currentScroll = scrollContainer.scrollLeft;
    //
    //   const targetScroll = currentScroll + distance;
    //   const maxScroll =
    //     scrollContainer.scrollWidth - scrollContainer.clientWidth;
    //   console.log(maxScroll);
    //   const finalScroll = Math.min(Math.max(targetScroll, 0), maxScroll);
    //
    //   scrollContainer.scrollTo({
    //     left: finalScroll,
    //     behavior: 'smooth',
    //   });
    // }
  }

  @HostListener('panmove', ['$event'])
  onPanMove(event: HammerInput) {
    // console.log(event.deltaX);
    // const scrollContainer = this.elementRef.nativeElement.querySelector(
    //   '.mat-tab-link-container'
    // );
    // const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    // const currentScroll = scrollContainer.scrollLeft;
    // console.log(currentScroll);
    // const targetScroll = currentScroll - event.deltaX;
    // const finalScroll = Math.max(Math.min(targetScroll, maxScroll), 0);
    // scrollContainer.scroll({
    //   left: finalScroll,
    //   behaviour: 'smooth',
    // });
    this.tabListMaxScroll =
      -1 * (this.tabList.offsetWidth - this.tabListContainer.offsetWidth);
    if (!this.tabList || !this.tabListMaxScroll) {
      return;
    }
    let newScroll = this.currentScroll + event.deltaX;
    if (newScroll > 0) {
      newScroll = 0;

      const nextPaginator = this.matTabNav._nextPaginator.nativeElement;
      nextPaginator.classList.remove('mat-tab-header-pagination-disabled');
      this.renderer.removeAttribute(nextPaginator, 'disabled');

      const previousPaginator = this.matTabNav._previousPaginator.nativeElement;
      previousPaginator.classList.add('mat-tab-header-pagination-disabled');
      this.renderer.setAttribute(previousPaginator, 'disabled', 'true');
    }
    if (newScroll < this.tabListMaxScroll) {
      const previousPaginator = this.matTabNav._previousPaginator.nativeElement;
      previousPaginator.classList.remove('mat-tab-header-pagination-disabled');
      this.renderer.removeAttribute(previousPaginator, 'disabled');

      const nextPaginator = this.matTabNav._nextPaginator.nativeElement;
      nextPaginator.classList.add('mat-tab-header-pagination-disabled');
      this.renderer.setAttribute(nextPaginator, 'disabled', 'true');

      newScroll = this.tabListMaxScroll;
    }
    if (newScroll < 0 && newScroll > this.tabListMaxScroll) {
      const nextPaginator = this.matTabNav._nextPaginator.nativeElement;
      if (
        nextPaginator.classList.contains('mat-tab-header-pagination-disabled')
      ) {
        nextPaginator.classList.remove('mat-tab-header-pagination-disabled');
        this.renderer.removeAttribute(nextPaginator, 'disabled');
      }

      const previousPaginator = this.matTabNav._previousPaginator.nativeElement;
      if (
        previousPaginator.classList.contains(
          'mat-tab-header-pagination-disabled'
        )
      ) {
        previousPaginator.classList.remove(
          'mat-tab-header-pagination-disabled'
        );
        this.renderer.removeAttribute(previousPaginator, 'disabled');
      }
    }
    // console.log(newScroll);
    this.tabList.style.transform = `translateX(${newScroll}px`;
    if (this.previousDeltaX === event.deltaX) {
      console.log('equal');
    }
    this.previousDeltaX = event.deltaX;
  }
}
